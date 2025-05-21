import openai
from config import OPENAI_API_KEY

openai.api_key = OPENAI_API_KEY

response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Just confirm that my OpenAI API key is working."}
    ]
)

print(response['choices'][0]['message']['content'])