
# ==========================================
# LEARNING RECOMMENDATION ENGINE
# ==========================================

LEARNING_RESOURCES = {

    "Python": {
        "description": "Learn Python programming fundamentals.",
        "resources": [
            {
                "name": "Python Official Tutorial",
                "platform": "Python",
                "url": "https://docs.python.org/3/tutorial/"
            }
        ]
    },

    "NumPy": {
        "description": "Learn numerical computing and array operations.",
        "resources": [
            {
                "name": "NumPy Documentation",
                "platform": "NumPy",
                "url": "https://numpy.org/learn/"
            }
        ]
    },

    "Pandas": {
        "description": "Learn data manipulation and analysis.",
        "resources": [
            {
                "name": "Pandas Getting Started",
                "platform": "Pandas",
                "url": "https://pandas.pydata.org/docs/getting_started/"
            }
        ]
    },

    "Machine Learning": {
        "description": "Understand machine learning algorithms and model building.",
        "resources": [
            {
                "name": "Machine Learning Crash Course",
                "platform": "Google",
                "url": "https://developers.google.com/machine-learning/crash-course"
            }
        ]
    },

    "Deep Learning": {
        "description": "Learn neural networks and deep learning concepts.",
        "resources": [
            {
                "name": "Deep Learning Specialization",
                "platform": "DeepLearning.AI",
                "url": "https://www.deeplearning.ai/courses/deep-learning-specialization/"
            }
        ]
    },

    "Scikit-learn": {
        "description": "Learn machine learning model training and evaluation.",
        "resources": [
            {
                "name": "Scikit-learn Tutorials",
                "platform": "Scikit-learn",
                "url": "https://scikit-learn.org/stable/tutorial/index.html"
            }
        ]
    },

    "TensorFlow": {
        "description": "Learn deep learning using TensorFlow.",
        "resources": [
            {
                "name": "TensorFlow Tutorials",
                "platform": "TensorFlow",
                "url": "https://www.tensorflow.org/tutorials"
            }
        ]
    },

    "PyTorch": {
        "description": "Learn deep learning using PyTorch.",
        "resources": [
            {
                "name": "PyTorch Tutorials",
                "platform": "PyTorch",
                "url": "https://pytorch.org/tutorials/"
            }
        ]
    },

    "SQL": {
        "description": "Learn database queries and data retrieval.",
        "resources": [
            {
                "name": "SQL Tutorial",
                "platform": "W3Schools",
                "url": "https://www.w3schools.com/sql/"
            }
        ]
    },

    "MySQL": {
        "description": "Learn relational database management using MySQL.",
        "resources": [
            {
                "name": "MySQL Documentation",
                "platform": "MySQL",
                "url": "https://dev.mysql.com/doc/"
            }
        ]
    },

    "Matplotlib": {
        "description": "Learn data visualization using Python.",
        "resources": [
            {
                "name": "Matplotlib Tutorials",
                "platform": "Matplotlib",
                "url": "https://matplotlib.org/stable/tutorials/"
            }
        ]
    },

    "FastAPI": {
        "description": "Learn how to develop APIs using Python.",
        "resources": [
            {
                "name": "FastAPI Tutorial",
                "platform": "FastAPI",
                "url": "https://fastapi.tiangolo.com/tutorial/"
            }
        ]
    },

    "Git": {
        "description": "Learn version control and source code management.",
        "resources": [
            {
                "name": "Git Documentation",
                "platform": "Git",
                "url": "https://git-scm.com/doc"
            }
        ]
    },

    "OOP": {
        "description": "Learn object-oriented programming concepts.",
        "resources": [
            {
                "name": "Python Classes Tutorial",
                "platform": "Python",
                "url": "https://docs.python.org/3/tutorial/classes.html"
            }
        ]
    }
}


# ==========================================
# GENERATE LEARNING RECOMMENDATIONS
# ==========================================


def generate_learning_recommendations(missing_skills: list):

    recommendations = []

    for skill in missing_skills:

        # Find the matching skill without case sensitivity
        matched_skill = next(
            (
                key for key in LEARNING_RESOURCES
                if key.lower() == skill.lower()
            ),
            None
        )

        if matched_skill:

            resource = LEARNING_RESOURCES[matched_skill]

            recommendations.append({
                "skill": matched_skill,
                "description": resource["description"],
                "resources": resource["resources"]
            })

        else:

            recommendations.append({
                "skill": skill,
                "description": f"Learn the fundamentals of {skill}.",
                "resources": []
            })

    return recommendations
