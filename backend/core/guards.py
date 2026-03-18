from openai import OpenAI
from groq import Groq
import json
from backend.core.config import settings

openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
groq_client = Groq(api_key=settings.GROQ_API_KEY)


def check_moderation(text: str) -> dict:
    """OpenAI moderation — toxic, hate, violence. Free, instant."""
    response = openai_client.moderations.create(input=text)
    result = response.results[0]
    return {
        "flagged": result.flagged,
        "categories": {k: v for k, v in result.categories.__dict__.items() if v}
    }


def check_prompt_injection(text: str) -> dict:
    """Llama Prompt Guard 2 — returns injection probability score."""
    response = groq_client.chat.completions.create(
        model="meta-llama/llama-prompt-guard-2-86m",
        messages=[{"role": "user", "content": text}]
    )
    result = response.choices[0].message.content.strip()
    
    # Prompt Guard 2 returns a probability score between 0 and 1
    # Score close to 1 = injection, score close to 0 = safe
    try:
        score = float(result)
        unsafe = score > 0.5  # threshold
    except ValueError:
        # fallback if it returns text instead of score
        unsafe = result.lower().startswith("unsafe")
    
    return {"injection": unsafe, "score": result}


def check_pii(text: str) -> dict:
    """GPT-4o-mini — PII detection."""
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0,
        messages=[
            {"role": "system", "content": """You are a PII detector.
            Check if the input contains personal information:
            emails, phone numbers, SSNs, credit cards, passwords, addresses.
            Respond in exactly this format:
            PII: true or false
            REASON: one sentence or 'None'"""},
            {"role": "user", "content": f"Check this for PII: {text}"}
        ]
    )
    content = response.choices[0].message.content.strip()
    pii = False
    reason = "None"
    for line in content.split("\n"):
        if line.startswith("PII:"):
            pii = "true" in line.lower()
        elif line.startswith("REASON:"):
            reason = line.replace("REASON:", "").strip()
    return {"pii": pii, "reason": reason}


def validate_input(query: str) -> dict:
    """Run all input checks. Returns ok=True if safe."""
    if not query or not query.strip():
        return {"ok": False, "reason": "Query cannot be empty"}
    if len(query.strip()) < 5:
        return {"ok": False, "reason": "Query too short — minimum 5 characters"}
    if len(query) > 500:
        return {"ok": False, "reason": "Query too long — maximum 500 characters"}

    # Toxic/harmful content
    mod = check_moderation(query)
    if mod["flagged"]:
        return {"ok": False, "reason": f"Content policy violation: {list(mod['categories'].keys())}"}

    # Prompt injection
    injection = check_prompt_injection(query)
    if injection["injection"]:
        return {"ok": False, "reason": "Prompt injection detected"}

    # PII
    pii = check_pii(query)
    if pii["pii"]:
        return {"ok": False, "reason": "PII detected — do not include personal information"}

    return {"ok": True, "reason": ""}


def validate_output(output: str, source_material: str) -> dict:
    """Check output for toxicity and fact grounding."""
    # Toxic content
    mod = check_moderation(output)
    if mod["flagged"]:
        return {"ok": False, "reason": f"Output flagged: {list(mod['categories'].keys())}"}

    # Fact check
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0,
        messages=[
            {"role": "system", "content": """You are a fact checker.
            Check if the report is grounded in the provided source material.
            Respond in exactly this format:
            GROUNDED: true or false
            REASON: one sentence or 'None'"""},
            {"role": "user", "content": f"""
            Source material:
            {source_material[:2000]}

            Report to fact check:
            {output[:2000]}
            """}
        ]
    )
    content = response.choices[0].message.content.strip()
    grounded = True
    reason = "None"
    for line in content.split("\n"):
        if line.startswith("GROUNDED:"):
            grounded = "true" in line.lower()
        elif line.startswith("REASON:"):
            reason = line.replace("REASON:", "").strip()

    if not grounded:
        return {"ok": False, "reason": f"Output not grounded in sources: {reason}"}

    return {"ok": True, "reason": ""}