"""Deterministic, zero-configuration analysis used by the MVP.

This is intentionally conservative: it only reports skills visible in the
supplied documents and never invents achievements. The AI pipeline can replace
it when a Google API key is configured.
"""
from __future__ import annotations

import re
import time


SKILLS: dict[str, tuple[str, ...]] = {
    "Python": ("python",),
    "JavaScript": ("javascript", "js"),
    "TypeScript": ("typescript", "ts"),
    "Java": ("java",),
    "C#": ("c#", "c sharp", ".net"),
    "Go": ("golang", "go"),
    "React": ("react", "react.js", "reactjs"),
    "Angular": ("angular",),
    "Vue.js": ("vue", "vue.js", "vuejs"),
    "Node.js": ("node", "node.js", "nodejs"),
    "FastAPI": ("fastapi",),
    "Django": ("django",),
    "Spring Boot": ("spring boot",),
    "SQL": ("sql",),
    "PostgreSQL": ("postgresql", "postgres"),
    "MySQL": ("mysql",),
    "MongoDB": ("mongodb", "mongo"),
    "Redis": ("redis",),
    "REST APIs": ("rest api", "restful", "rest services"),
    "GraphQL": ("graphql",),
    "AWS": ("aws", "amazon web services"),
    "Azure": ("azure",),
    "Google Cloud": ("gcp", "google cloud"),
    "Docker": ("docker", "containerization"),
    "Kubernetes": ("kubernetes", "k8s"),
    "Terraform": ("terraform", "infrastructure as code"),
    "Git": ("git", "github", "gitlab"),
    "CI/CD": ("ci/cd", "continuous integration", "continuous delivery"),
    "Linux": ("linux", "unix"),
    "Machine Learning": ("machine learning", "ml models", "predictive models"),
    "Deep Learning": ("deep learning", "neural networks"),
    "NLP": ("natural language processing", "nlp"),
    "LLMs": ("large language model", "large language models", "llm", "llms"),
    "RAG": ("retrieval augmented generation", "retrieval-augmented generation", "rag"),
    "LangChain": ("langchain",),
    "Data Analysis": ("data analysis", "data analytics", "data analyst"),
    "Pandas": ("pandas",),
    "NumPy": ("numpy",),
    "Scikit-learn": ("scikit-learn", "sklearn"),
    "TensorFlow": ("tensorflow",),
    "PyTorch": ("pytorch",),
    "Power BI": ("power bi", "powerbi"),
    "Tableau": ("tableau",),
    "Agile": ("agile", "scrum", "kanban"),
    "Project Management": ("project management", "project manager"),
    "Leadership": ("leadership", "led a team", "team lead"),
    "Communication": ("communication", "stakeholder management", "presented to"),
    "Problem Solving": ("problem solving", "problem-solving"),
    "Testing": ("unit testing", "automated testing", "pytest", "jest", "testing"),
}

SKILL_GROUPS = (
    {"JavaScript", "TypeScript", "React", "Angular", "Vue.js", "Node.js"},
    {"Python", "FastAPI", "Django"},
    {"SQL", "PostgreSQL", "MySQL"},
    {"AWS", "Azure", "Google Cloud"},
    {"Docker", "Kubernetes", "Terraform"},
    {"Machine Learning", "Deep Learning", "NLP", "LLMs", "RAG", "LangChain"},
)


def analyze_locally(cv_text: str, job_description: str, started_at: float | None = None) -> dict:
    """Return the API's full response shape without an external AI service."""
    started_at = started_at or time.time()
    job_skills = _extract_skills(job_description)
    cv_skills = _extract_skills(cv_text)
    requirements = _build_job_requirements(job_description, job_skills)
    profile = _build_cv_profile(cv_text, cv_skills)
    matches, missing = _compare_skills(job_skills, cv_skills, job_description, cv_text)
    score = _match_score(matches, missing)
    required_years = requirements["experience_years"]
    candidate_years = profile["total_years_experience"]
    meets_experience = required_years is None or candidate_years >= required_years
    strengths = [item["skill"] for item in matches if item["status"] == "strong_match"][:5]
    gaps = [item["skill"] for item in missing if item["priority"] != "nice_to_have"][:5]

    gap_analysis = {
        "match_score": score,
        "matching_skills": matches,
        "missing_skills": missing,
        "experience_assessment": {
            "meets_requirements": meets_experience,
            "assessment": _experience_assessment(candidate_years, required_years),
            "strengths": strengths or ["The CV contains transferable experience to discuss."],
            "gaps": gaps,
        },
        "education_assessment": _education_assessment(
            requirements["education_level"], profile["education"]
        ),
        "overall_verdict": _verdict(score, strengths, gaps),
        "top_priorities": _priorities(missing, matches),
    }

    return {
        "job_title": requirements["title"],
        "match_score": score,
        "job_requirements": requirements,
        "cv_profile": profile,
        "gap_analysis": gap_analysis,
        "resume_optimization": _resume_optimization(
            cv_text, requirements["title"], matches, missing
        ),
        "interview_preparation": _interview_preparation(
            requirements["title"], matches, missing, cv_text
        ),
        "evaluation": {"quality_score": None, "retrieval_coverage": round(score / 100, 2)},
        "metadata": {
            "processing_time_seconds": round(time.time() - started_at, 2),
            "agents_used": ["local_skill_matcher", "local_coach"],
            "cv_chunks_created": max(1, len(cv_text) // 800 + 1),
            "skills_analyzed": len(job_skills),
            "analysis_mode": "local",
        },
    }


def _contains(text: str, phrase: str) -> bool:
    return bool(re.search(rf"(?<!\w){re.escape(phrase.lower())}(?!\w)", text.lower()))


def _extract_skills(text: str) -> list[str]:
    return [
        canonical
        for canonical, aliases in SKILLS.items()
        if any(_contains(text, alias) for alias in aliases)
    ]


def _skill_level(skill: str, text: str) -> str:
    lowered = text.lower()
    for alias in SKILLS[skill]:
        position = lowered.find(alias)
        if position < 0:
            continue
        context = lowered[max(0, position - 80): position + len(alias) + 80]
        if any(word in context for word in ("nice to have", "bonus", "optional")):
            return "nice_to_have"
        if any(word in context for word in ("preferred", "ideally", "a plus")):
            return "preferred"
    return "required"


def _skill_category(skill: str) -> str:
    if skill in {"Leadership", "Communication", "Problem Solving", "Agile", "Project Management"}:
        return "soft"
    if skill in {"Git", "Docker", "Kubernetes", "Terraform", "Power BI", "Tableau"}:
        return "tool"
    return "technical"


def _build_job_requirements(text: str, skills: list[str]) -> dict:
    title = _extract_title(text)
    return {
        "title": title,
        "company": _extract_company(text),
        "seniority_level": _seniority(title),
        "required_skills": [
            {
                "skill": skill,
                "level": _skill_level(skill, text),
                "category": _skill_category(skill),
            }
            for skill in skills
        ],
        "responsibilities": _extract_list_items(text, ("responsib", "you will", "duties"))[:8],
        "qualifications": _extract_list_items(text, ("qualif", "require", "you have"))[:8],
        "experience_years": _extract_years(text),
        "education_level": _extract_education(text),
        "industry": None,
        "key_technologies": [
            skill for skill in skills if _skill_category(skill) in {"technical", "tool"}
        ],
    }


def _extract_title(text: str) -> str:
    match = re.search(r"(?im)^\s*(?:job\s+title|position|role)\s*[:\-]\s*(.{3,80})$", text)
    if match:
        return match.group(1).strip(" .|")
    match = re.search(
        r"(?i)(?:looking for|hiring|seeking)\s+(?:an?\s+)?([A-Z][A-Za-z0-9 /&+.-]{2,60}?)(?:\s+to\b|\s+who\b|[,.])",
        text,
    )
    if match:
        return match.group(1).strip()
    for line in text.splitlines()[:8]:
        cleaned = line.strip(" #*-|\t")
        if 3 <= len(cleaned) <= 70 and not cleaned.endswith((".", ":", ";")):
            if any(word in cleaned.lower() for word in (
                "engineer", "developer", "analyst", "manager", "designer", "specialist", "scientist"
            )):
                return cleaned
    return "Target Role"


def _extract_company(text: str) -> str | None:
    match = re.search(r"(?im)^\s*company\s*[:\-]\s*(.{2,80})$", text)
    return match.group(1).strip(" .|") if match else None


def _seniority(title: str) -> str | None:
    for value in ("Intern", "Junior", "Senior", "Lead", "Staff", "Principal", "Head", "Director"):
        if value.lower() in title.lower():
            return value
    return None


def _extract_years(text: str) -> int | None:
    matches = re.findall(r"(?i)(\d{1,2})(?:\s*[-–]\s*\d{1,2})?\+?\s+years?", text)
    return min(map(int, matches)) if matches else None


def _extract_education(text: str) -> str | None:
    lowered = text.lower()
    for label, aliases in (
        ("PhD", ("phd", "doctorate")),
        ("Master's degree", ("master's", "masters degree", "m.sc", "msc")),
        ("Bachelor's degree", ("bachelor's", "bachelors degree", "b.sc", "bsc")),
    ):
        if any(alias in lowered for alias in aliases):
            return label
    return None


def _extract_list_items(text: str, section_markers: tuple[str, ...]) -> list[str]:
    lines = [line.strip() for line in text.splitlines()]
    items = [
        re.sub(r"^[•*+\-–—\d.)\s]+", "", line).strip()
        for line in lines
        if re.match(r"^\s*(?:[•*+\-–—]|\d+[.)])\s+\S", line)
    ]
    if items:
        return [item for item in items if len(item) > 10]
    sentences = re.split(r"(?<=[.!?])\s+", " ".join(lines))
    return [
        sentence.strip()
        for sentence in sentences
        if any(marker in sentence.lower() for marker in section_markers)
    ]


def _build_cv_profile(text: str, skills: list[str]) -> dict:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    name = next(
        (
            line for line in lines[:6]
            if 3 <= len(line) <= 50
            and not any(word in line.lower() for word in ("resume", "curriculum", "profile", "email", "@"))
        ),
        "Candidate",
    )
    bullets = _extract_list_items(text, ("built", "developed", "managed", "led", "created"))
    education_level = _extract_education(text)
    education = []
    if education_level:
        education.append({
            "degree": education_level,
            "institution": "Institution listed in CV",
            "year": "See CV",
            "gpa": None,
            "relevant_coursework": [],
        })
    current_title = _extract_cv_title(lines)
    return {
        "name": name,
        "current_title": current_title,
        "skills": skills,
        "experience": [{
            "job_title": current_title or "Professional experience",
            "company": "See CV",
            "duration": "See CV",
            "responsibilities": bullets[:8],
            "technologies": skills,
        }] if bullets else [],
        "education": education,
        "certifications": [],
        "projects": [],
        "total_years_experience": float(_estimate_cv_years(text)),
        "summary": _profile_summary(skills, bullets),
    }


def _extract_cv_title(lines: list[str]) -> str | None:
    role_words = ("engineer", "developer", "analyst", "manager", "designer", "specialist", "scientist")
    return next((line for line in lines[:15] if len(line) < 80 and any(w in line.lower() for w in role_words)), None)


def _estimate_cv_years(text: str) -> int:
    explicit = re.search(r"(?i)(\d{1,2})\+?\s+years?(?:\s+of)?\s+experience", text)
    if explicit:
        return int(explicit.group(1))
    years = [int(year) for year in re.findall(r"\b(?:19|20)\d{2}\b", text)]
    if len(years) >= 2:
        return min(40, max(years) - min(years))
    return 0


def _profile_summary(skills: list[str], bullets: list[str]) -> str:
    if not skills:
        return "The CV was parsed successfully, but no skills from the MVP catalogue were detected."
    evidence = " with documented work experience" if bullets else ""
    return f"Candidate{evidence} across {', '.join(skills[:6])}."


def _compare_skills(
    job_skills: list[str], cv_skills: list[str], job_text: str, cv_text: str
) -> tuple[list[dict], list[dict]]:
    matches: list[dict] = []
    missing: list[dict] = []
    cv_set = set(cv_skills)
    for skill in job_skills:
        level = _skill_level(skill, job_text)
        priority = {
            "required": "critical", "preferred": "important", "nice_to_have": "nice_to_have"
        }[level]
        if skill in cv_set:
            matches.append({
                "skill": skill,
                "status": "strong_match",
                "evidence": _evidence_for_skill(skill, cv_text),
                "priority": priority,
            })
            continue
        related = _related_skill(skill, cv_set)
        if related:
            matches.append({
                "skill": skill,
                "status": "partial_match",
                "evidence": f"The CV shows related experience with {related}, but does not explicitly mention {skill}.",
                "priority": priority,
            })
        else:
            missing.append({
                "skill": skill,
                "status": "missing",
                "evidence": f"No explicit evidence of {skill} was found in the CV.",
                "priority": priority,
            })
    return matches, missing


def _related_skill(skill: str, cv_skills: set[str]) -> str | None:
    for group in SKILL_GROUPS:
        if skill in group:
            related = sorted(group & cv_skills)
            return related[0] if related else None
    return None


def _evidence_for_skill(skill: str, text: str) -> str:
    sentences = re.split(r"(?<=[.!?])\s+|\n+", text)
    for sentence in sentences:
        if any(_contains(sentence, alias) for alias in SKILLS[skill]):
            cleaned = sentence.strip(" •*-–—\t")
            if cleaned:
                return cleaned[:240]
    return f"{skill} is explicitly listed in the CV."


def _match_score(matches: list[dict], missing: list[dict]) -> float:
    all_items = matches + missing
    if not all_items:
        return 0.0
    weights = {"critical": 3, "important": 2, "nice_to_have": 1}
    earned = sum(
        weights[item["priority"]] * (
            1 if item["status"] == "strong_match" else 0.5 if item["status"] == "partial_match" else 0
        )
        for item in all_items
    )
    possible = sum(weights[item["priority"]] for item in all_items)
    return round(100 * earned / possible, 1)


def _experience_assessment(candidate: float, required: int | None) -> str:
    if required is None:
        return "The posting does not state a minimum number of years. Review the matched skills and CV evidence below."
    if candidate >= required:
        return f"The CV indicates approximately {candidate:g} years of experience against a stated {required}-year minimum."
    if candidate:
        return f"The CV indicates approximately {candidate:g} years against a stated {required}-year minimum."
    return f"The posting asks for {required} years, but the MVP could not reliably infer a duration from the CV."


def _education_assessment(required: str | None, education: list[dict]) -> str:
    if required is None:
        return "No explicit degree requirement was detected in the job description."
    if education:
        return f"The posting mentions {required}; the CV contains an education credential. Confirm the field and equivalency manually."
    return f"The posting mentions {required}, but no matching degree text was detected in the CV."


def _priorities(missing: list[dict], matches: list[dict]) -> list[str]:
    result = [
        f"Add truthful evidence for {item['skill']} or address the gap directly."
        for item in missing[:3]
    ]
    partials = [item for item in matches if item["status"] == "partial_match"]
    result.extend(
        f"Make the connection between {item['skill']} and your related experience explicit."
        for item in partials[:2]
    )
    if not result:
        result.append("Lead the resume with the strongest matched skills and measurable outcomes.")
    return result[:5]


def _verdict(score: float, strengths: list[str], gaps: list[str]) -> str:
    if score >= 75:
        opening = "The CV shows strong alignment with the skills detected in this posting."
    elif score >= 45:
        opening = "The CV shows partial alignment and is worth tailoring before applying."
    else:
        opening = "The CV has meaningful gaps against the skills detected in this posting."
    detail = f" Strongest matches: {', '.join(strengths[:3])}." if strengths else ""
    gap = f" Highest-priority gaps: {', '.join(gaps[:3])}." if gaps else ""
    return opening + detail + gap


def _resume_optimization(
    cv_text: str, title: str, matches: list[dict], missing: list[dict]
) -> dict:
    strong = [item["skill"] for item in matches if item["status"] == "strong_match"]
    bullets = _extract_list_items(
        cv_text, ("built", "developed", "managed", "led", "created")
    )[:3]
    improvements = [{
        "original": bullet,
        "improved": _tighten_bullet(bullet),
        "rationale": "Uses a direct action verb and keeps the claim grounded in the original CV.",
    } for bullet in bullets]
    return {
        "tailored_summary": (
            f"Professional targeting {title} roles with demonstrated experience in "
            f"{', '.join(strong[:4]) or 'transferable skills'}. Focused on delivering "
            "clear outcomes and adapting existing strengths to the role's priorities."
        ),
        "bullet_improvements": improvements,
        "keyword_suggestions": [{
            "keyword": item["skill"],
            "where_to_add": "Skills or relevant experience",
            "context": "Add only if you can support it with real coursework, projects, or work evidence.",
        } for item in missing[:6]],
        "new_bullet_points": [
            f"If accurate, add a result-focused example demonstrating {skill}."
            for skill in strong[:3]
        ],
        "formatting_tips": [
            "Put the most relevant skills and recent experience on the first page.",
            "Use consistent dates and action-led bullet points.",
            "Add metrics only where you can verify them.",
        ],
    }


def _tighten_bullet(text: str) -> str:
    cleaned = re.sub(r"(?i)^responsible for\s+", "", text.strip().rstrip("."))
    if not re.match(
        r"(?i)^(built|created|delivered|developed|designed|implemented|improved|led|managed|optimized|reduced|launched)\b",
        cleaned,
    ):
        cleaned = f"Delivered {cleaned[0].lower() + cleaned[1:]}" if cleaned else "Delivered a documented outcome"
    return cleaned + "."


def _interview_preparation(
    title: str, matches: list[dict], missing: list[dict], cv_text: str
) -> dict:
    strong = [item["skill"] for item in matches if item["status"] == "strong_match"]
    gaps = [item["skill"] for item in missing]
    evidence = _extract_list_items(
        cv_text, ("built", "developed", "managed", "led", "created")
    )
    example = evidence[0] if evidence else "Choose one real project or responsibility from your CV"
    questions = [
        {
            "question": f"Why are you interested in this {title} role?",
            "category": "behavioral",
            "why_asked": "To test motivation and whether your experience connects to the role.",
            "suggested_answer": f"Connect the role's priorities to your experience. Start with: “{example[:180]}”, then explain why that work makes this role a logical next step.",
            "tips": ["Keep the answer under two minutes.", "Name two role-specific reasons."],
        },
        {
            "question": "Walk me through a relevant project and the result you achieved.",
            "category": "behavioral",
            "why_asked": "To validate ownership, judgment, and impact.",
            "suggested_answer": f"Use STAR: set the context for “{example[:180]}”, state your responsibility, describe your actions precisely, and finish with a verifiable result.",
            "tips": ["Separate your contribution from the team's.", "Use a metric only if it is accurate."],
        },
    ]
    for skill in strong[:2]:
        questions.append({
            "question": f"How have you used {skill} in practice?",
            "category": "technical",
            "why_asked": f"To validate the {skill} evidence in your CV.",
            "suggested_answer": f"Explain the problem, why {skill} was appropriate, the trade-offs you considered, and the outcome. Anchor the answer in a real CV example.",
            "tips": ["Be ready for follow-up questions about alternatives.", "Mention one lesson learned."],
        })
    if gaps:
        questions.append({
            "question": f"This role uses {gaps[0]}. How would you get productive with it?",
            "category": "situational",
            "why_asked": "To assess honesty, learning speed, and transferability.",
            "suggested_answer": f"Acknowledge that {gaps[0]} is not yet evidenced in the CV. Connect it to the closest skill you know, give a concrete learning plan, and avoid claiming production experience you do not have.",
            "tips": ["Be direct about the gap.", "Offer a 30-day learning plan."],
        })
    return {
        "role_summary": f"Expect questions that test practical evidence, decision-making, and fit for the {title} role.",
        "questions": questions,
        "general_tips": [
            "Prepare three reusable STAR stories from your real experience.",
            "Research the company and connect your questions to its product.",
            "Answer skill-gap questions honestly and show a concrete learning plan.",
        ],
        "topics_to_study": gaps[:5] or strong[:5],
    }
