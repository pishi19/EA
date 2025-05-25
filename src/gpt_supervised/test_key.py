import openai

from config import OPENAI_API_KEY

openai.api_key = OPENAI_API_KEY

try:
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {
                "role": "user",
                "content": "Just confirm that my OpenAI API key is working.",
            },
        ],
    )
    print("✅ API key is working!")
    print("Response:", response["choices"][0]["message"]["content"])
except Exception as e:
    print("❌ API key test failed!")
    print("Error:", str(e))
