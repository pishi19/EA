from openai import OpenAI
from vault_state import update_vault_structure, VAULT_STRUCTURE
from config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)

def ask_gpt(prompt, context=None, model="gpt-4o"):
    system_prompt = "You are a structure-aware assistant helping reflect on an Obsidian vault."
    if context:
        context_str = "\n".join([f"{k}: {', '.join(v)}" for k, v in context.items()])
        full_prompt = f"{prompt}\n\nVault Structure:\n{context_str}"
    else:
        full_prompt = prompt

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": full_prompt}
        ]
    )

    return response.choices[0].message.content

if __name__ == "__main__":
    update_vault_structure()
    question = "What can you infer about which parts of the vault are overextended or neglected?"
    result = ask_gpt(question, context=VAULT_STRUCTURE)
    print("🔍 GPT Analysis:")
    print(result)
