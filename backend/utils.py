def calculate_paper_grade(total_score: float) -> str:
    if total_score >= 70:
        return 'A'
    elif total_score >= 60:
        return 'B'
    elif total_score >= 50:
        return 'C'
    elif total_score >= 45:
        return 'D'
    else:
        return 'F'
