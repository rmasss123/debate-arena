import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

MODEL = "llama-3.1-8b-instant"

AGENT_PERSONAS = {
    "Optimist": {
        "base": (
            "You are the Optimist debater. You always argue for the positive, hopeful, "
            "and constructive side of any topic. You highlight benefits, opportunities, "
            "and the best-case outcomes. Be enthusiastic and forward-looking."
        ),
        "style_winning": (
            "The audience is responding well to your arguments. Continue with confidence, "
            "build on your strongest points, and stay clear and compelling."
        ),
        "style_losing": (
            "The audience has been favoring your opponent. Dig deeper — bring more "
            "concrete evidence, be more passionate, and directly counter their weakest claims."
        ),
    },
    "Critic": {
        "base": (
            "You are the Critic debater. You argue skeptically, pointing out flaws, risks, "
            "unintended consequences, and overlooked downsides. Be sharp, analytical, and "
            "challenge assumptions relentlessly."
        ),
        "style_winning": (
            "The audience appreciates your critical eye. Press your advantage — sharpen your "
            "attacks on the weakest parts of your opponent's argument."
        ),
        "style_losing": (
            "Your opponent has swayed the audience. Switch tactics: ask harder questions, "
            "expose logical gaps, and reframe the debate on your terms."
        ),
    },
    "Philosopher": {
        "base": (
            "You are the Philosopher debater. You approach every topic through ethics, logic, "
            "first principles, and the broader human condition. You challenge the very framing "
            "of the question and seek deeper truths."
        ),
        "style_winning": (
            "Your philosophical framing is resonating. Go deeper — explore the implications "
            "and push the debate toward its most meaningful dimensions."
        ),
        "style_losing": (
            "The audience is distracted by surface-level arguments. Reground the debate in "
            "fundamental principles — remind them what truly matters here."
        ),
    },
}


def _build_system_prompt(agent_name: str, vote_feedback: dict) -> str:
    persona = AGENT_PERSONAS[agent_name]
    prompt = persona["base"] + "\n\n"

    if vote_feedback:
        winning = vote_feedback.get("winner_agent") == agent_name
        prompt += persona["style_winning"] if winning else persona["style_losing"]
        prompt += "\n\n"

    prompt += (
        "Keep your argument to 3-5 sentences. Be direct and debate-ready. "
        "Do not use headers or bullet points — speak in flowing prose."
    )
    return prompt


def _build_user_prompt(topic: str, round_number: int, previous_arguments: list) -> str:
    history = ""
    if previous_arguments:
        history = "Previous arguments in this debate:\n"
        for arg in previous_arguments:
            history += f"  [{arg['agent_name']} - Round {arg['round_number']}]: {arg['content']}\n"
        history += "\n"

    return (
        f"{history}"
        f"Debate topic: {topic}\n"
        f"This is Round {round_number}. Make your argument now."
    )


def generate_argument(
    agent_name: str,
    topic: str,
    round_number: int,
    previous_arguments: list,
    vote_feedback: dict = None,
) -> str:
    if agent_name not in AGENT_PERSONAS:
        raise ValueError(f"Unknown agent: {agent_name}. Must be one of {list(AGENT_PERSONAS.keys())}")

    system_prompt = _build_system_prompt(agent_name, vote_feedback or {})
    user_prompt = _build_user_prompt(topic, round_number, previous_arguments)

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=300,
        temperature=0.85,
    )

    return response.choices[0].message.content.strip()


def score_argument(content: str, topic: str) -> int:
    """Score an argument 1-10 for rhetorical strength. Returns a single integer."""
    import re
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a debate judge scoring arguments for rhetorical strength. "
                        "Consider clarity, evidence, persuasiveness, and logical consistency. "
                        "Respond with ONLY a single integer from 1 to 10. No other text."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Topic: {topic}\n\nArgument to score:\n{content}",
                },
            ],
            max_tokens=5,
            temperature=0.2,
        )
        raw = response.choices[0].message.content.strip()
        match = re.search(r"\d+", raw)
        if match:
            return max(1, min(10, int(match.group())))
    except Exception:
        pass
    return 5


def generate_moderator_summary(topic: str, all_arguments: list) -> str:
    history = "\n".join(
        f"[{arg['agent_name']} - Round {arg['round_number']}]: {arg['content']}"
        for arg in all_arguments
    )

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a neutral debate moderator. Summarize the debate fairly, "
                    "highlight the strongest points from each side, and offer a balanced "
                    "closing reflection. Keep it to 4-6 sentences."
                ),
            },
            {
                "role": "user",
                "content": f"Topic: {topic}\n\nDebate transcript:\n{history}\n\nProvide your moderator summary.",
            },
        ],
        max_tokens=350,
        temperature=0.6,
    )

    return response.choices[0].message.content.strip()
