import google.generativeai as genai
from constants import get_current_user
from env_const import GEMINI_API_KEY, OPENAI_API_KEY
from fastapi import APIRouter, Depends, HTTPException
from fastapi_utils.cbv import cbv
from model import User
from openai import OpenAI
from schema import RecommendRequest, Role, SyllabusRequest

openai_router = APIRouter(tags=["AI Assistant"])
gemini_router = APIRouter(tags=["GeminiAI Assistant"])

if OPENAI_API_KEY:
    client = OpenAI(api_key=OPENAI_API_KEY)
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


@cbv(openai_router)
class AIRoutes:
    # db: Session = Depends(get_db)
    current_user: User = Depends(get_current_user)

    def _check_student(self):
        if self.current_user.role != Role.STUDENT:
            raise HTTPException(status_code=403, detail="Student access required.")

    def _check_lecturer(self):
        if self.current_user.role != Role.LECTURER:
            raise HTTPException(status_code=403, detail="Lecturer access required.")

    @openai_router.post("/openai/recommend")
    def recommend_courses(self, data: RecommendRequest):
        # self._check_student()
        prompt = f"Suggest 5 university-level course titles for a student interested in: {', '.join(data.interests)}. Keep it concise."

        try:
            if OPENAI_API_KEY:
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a helpful course advisor.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                )
                suggestions = response.choices[0].message.content.strip()
            else:
                suggestions = "\n".join(
                    [f"{interest} Fundamentals" for interest in data.interests[:5]]
                )

            return {"status": "success", "suggestions": suggestions}

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"AI Recommendation failed: {str(e)}"
            )

    @openai_router.post("/syllabus")
    def generate_syllabus(self, data: SyllabusRequest):
        # self._check_lecturer()
        prompt = (
            f"Generate a detailed 10-week university-level course syllabus for the topic: {data.topic}. "
            "Include weekly topics, recommended readings, and assignment ideas."
        )

        try:
            if OPENAI_API_KEY:
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a helpful syllabus generator.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                )
                syllabus = response.choices[0].message.content.strip()
            else:
                syllabus = f"Week 1: Introduction to {data.topic}\nWeek 2: Advanced {data.topic}..."

            return {"status": "success", "syllabus": syllabus}

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"AI Syllabus generation failed: {str(e)}"
            )

    @openai_router.post("/gemini/syllabus")
    def generate_gemini_syllabus(self, data: SyllabusRequest):
        # self._check_lecturer()
        prompt = (
            f"Generate a detailed 12-week university-level course syllabus for the topic: {data.topic}. "
            "Include weekly topics, recommended readings, and assignment ideas."
        )
        try:
            try:
                model = genai.GenerativeModel("gemini-2.5-flash")
                response = model.generate_content(prompt)
            except Exception as e:
                if "quota" in str(e).lower() or "429" in str(e):
                    model = genai.GenerativeModel("models/gemini-2.5-pro")
                    response = model.generate_content(prompt)
                else:
                    raise e

            syllabus = (
                response.text.strip()
                if hasattr(response, "text")
                else "No content returned."
            )

            return {"status": "success", "syllabus": syllabus}
        except Exception as e:
            detail = str(e)
            if "quota" in detail.lower():
                raise HTTPException(
                    status_code=429,
                    detail="You have exceeded your free quota. Please try again later or upgrade your plan.",
                )
            raise HTTPException(
                status_code=500, detail=f"AI Syllabus generation failed: {detail}"
            )

    @openai_router.post("/gemini/recommend")
    def gemini_recommend_courses(self, data: RecommendRequest):
        # self._check_student()
        prompt = (
            f"Suggest 5 university-level course titles for a student interested in: "
            f"{', '.join(data.interests)}. Keep each suggestion concise and relevant to university academics."
        )
        try:
            try:
                model = genai.GenerativeModel("models/gemini-2.5-flash")
                response = model.generate_content(prompt)
            except Exception as e:
                if "quota" in str(e).lower() or "429" in str(e):
                    model = genai.GenerativeModel("models/gemini-2.5-pro")
                    response = model.generate_content(prompt)
                else:
                    raise e
            suggestions = (
                response.text.strip()
                if hasattr(response, "text")
                else "No suggestions returned."
            )
            return {"status": "success", "suggestions": suggestions}
        except Exception as e:
            detail = str(e)
            if "quota" in detail.lower() or "429" in detail:
                raise HTTPException(
                    status_code=429,
                    detail="You have exceeded your free quota. Please try again later or upgrade your plan.",
                )
            raise HTTPException(
                status_code=500, detail=f"AI Recommendation failed: {detail}"
            )
