from flask import Flask, request, jsonify
import base64
import json
import fitz
from io import BytesIO
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from flask_cors import CORS
import google.generativeai as genai
import numpy as np
import faiss
from typing_extensions import TypedDict
from grade import grade_pipeline


# Define the schema for the JSON response
class PromptResponse(TypedDict):
    prompt: str

app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes




def decode_base64_to_pdf(base64_string: str):
    """Decodes a Base64 string to a PDF file.

    Args:
        base64_string: The Base64 encoded string.
    Returns:
        True on success, False otherwise
    """
    try:

        pdf_bytes = base64.b64decode(base64_string.encode("utf-8")) #encode to bytes for decoding
       # Create a BytesIO object from the bytes
        pdf_stream = BytesIO(pdf_bytes)
        
        # Open PDF directly from memory
        pdf_document = fitz.open(stream=pdf_stream, filetype="pdf")

        return pdf_document
    except Exception as e:
        print(f"An error occurred during decoding: {e}")
        return False
    

# Optional: Enhanced chunking with content-aware splitting
def process_pdf_with_content_awareness(pdf_base64, chunk_size=500, chunk_overlap=100):
    """
    Process PDF with content-aware chunking strategies.
    
    Args:
        pdf_base64 (str): Encoded PDF file
        chunk_size (int): Maximum characters per chunk
        chunk_overlap (int): Number of characters to overlap between chunks
    
    Returns:
        list: List of dictionaries containing text chunks and metadata
    """
    try:
        # Load PDF
        doc = decode_base64_to_pdf(pdf_base64)
        
        # Extract text and create documents in LangChain format
        documents = []
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            documents.append(
                Document(
                    page_content=text,
                    metadata={
                        "page": page_num + 1,
                        "total_pages": len(doc)
                    }
                )
            )
        
        doc.close()
        # Create a content-aware text splitter
        text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=[
                "\n\n",  # Paragraph breaks
                "\n",    # Line breaks
                "。",    # Chinese/Japanese period
                ".",    # English period
                "！",   # Chinese/Japanese exclamation
                "!",    # English exclamation
                "？",   # Chinese/Japanese question mark
                "?",    # English question mark
                "；",   # Chinese/Japanese semicolon
                ";",    # English semicolon
                ",",    # English comma
                " ",    # Space
                ""      # Character
            ],
            is_separator_regex=False
        )
        
        # Split documents
        chunks = text_splitter.split_documents(documents)
        
        # Process chunks with enhanced metadata
        processed_chunks = []
        for i, chunk in enumerate(chunks):
            processed_chunks.append({
                'chunk_text': chunk.page_content,
                'page_num': chunk.metadata.get('page', None),
            })
        return processed_chunks
        
    except Exception as e:
        return []
    


async def RAG_pdfs(query, data, top_k=5):
    """
    Perform Retrieval-Augmented Generation (RAG) on a set of PDF chunks.
        
    Args:
        query (str): The query string to search for relevant chunks.
        data (list): List of dictionaries containing chunked text and metadata.
    
    Returns:
        list: List of dictionaries containing relevant chunks and their metadata.
    """
    
    if not data:
        return []
    texts = [chunk['chunk_text'] for chunk in data]
    
    genai.configure(api_key="AIzaSyBAhbIl_6r7d22Hz0UlIKQ_ffEq0orw0w0")
    
    embeddings = np.array(genai.embed_content(
        model="models/text-embedding-004",
        content=texts)["embedding"], dtype=np.float32)
    
    
    data_index = faiss.IndexFlatL2(768)
    data_index.add(embeddings)
    
    
    query_embedding = np.array(genai.embed_content(
        model="models/text-embedding-004",
        content=[query])["embedding"], dtype=np.float32)
    
    D, I = data_index.search(query_embedding, top_k)
    
    top_chunks = [data[i] for i in I[0]]
    return top_chunks

class QAPair(TypedDict):
    question: str
    answer: str

def generate_questions(prompt, chunks):
    """
    Generate 3 question-answer pairs focused on a specific PDF section, using context from related chunks.
    
    Args:
        prompt (str): Target section from educational PDF
        chunks (list): Relevant context chunks from RAG system
    
    Returns:
        list: Dicts with 'question' and 'answer' keys
    """
    
    context = "\n".join([chunk['chunk_text'] for chunk in chunks])
    
    instruction = (
        "As an educational content creator, generate 3 precise question-answer pairs focusing on "
        "the key concepts in the 'Target PDF Section' below. Use these guidelines:\n"
        "1. Base questions primarily on the Target Section\n"
        "2. Use Context only to enhance answers with related information\n"
        "3. Questions should test understanding of main concepts\n"
        "4. Answers must be concise and factually accurate\n"
        "5. Format as JSON list of dictionaries, each containing 'question' and 'answer'"
        "6. Use the 'Target PDF Section' as the main focus for questions and dont repate the same question"
    )
    
    combined_prompt = (
        f"{instruction}\n\n"
        f"Context:\n{context}\n\n"
        f"Target PDF Section:\n{prompt}\n\n"
        "JSON response:"
    )
    print("prompt: \n" + combined_prompt)
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    result = model.generate_content(
        combined_prompt,
        generation_config=genai.GenerationConfig(
            temperature=0.3,
            response_mime_type="application/json",
            # response_schema=list[QAPair]  # Corrected schema
        )
    )
    return json.loads(result.candidates[0].content.parts[0].text) if isinstance(json.loads(result.candidates[0].content.parts[0].text), list) else []


@app.route('/process', methods=['post'])
async def process():
    try:
        print("Processing PDF")
        data = request.get_json()
        pdf = data.get('pdf')
        paragrpath = data.get('paragrpath')
        if not pdf or not paragrpath:
            return jsonify({'error': 'Missing parameters'}), 400
        chunks = process_pdf_with_content_awareness(pdf)
        chunks = chunks[:3]
        result = await RAG_pdfs(paragrpath, chunks, 3)

        questions = generate_questions(paragrpath, result)
        return jsonify(questions), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/grade', methods=['post'])
def grade_questions():
    print("Processing questions")
    try:
        print("Processing questions")
        data = request.get_json()
        questions = data.get('questions')
        teacherId = data.get('teacherId')
        studentId = data.get('studentId')
        examId = data.get('examId')

        if not questions or not teacherId or not studentId or not examId:
            return jsonify({'error': 'Missing parameters'}), 400
        
        result = grade_pipeline(questions, teacherId, studentId, examId)

        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(port=8080)