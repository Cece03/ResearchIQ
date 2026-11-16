from flask import Flask, request, jsonify
from flask_cors import CORS


# ============================================================
# RESEARCH GENERATOR SERVICE
# ============================================================

from services.research_generator_service import (
    generate_research_response
)


# ============================================================
# KAGGLE SERVICE
# ============================================================

from services.kaggle_service import (
    search_datasets,
    get_dataset_details,
    download_dataset,
    test_kaggle_connection
)


# ============================================================
# OPENCITATIONS SERVICE
# ============================================================

from services.opencitations_service import (
    ask_question,
    get_paper_information,
    summarize_paper,
    upload_paper
)


# ============================================================
# OPENALEX SERVICE
# ============================================================

from services.openalex_service import (
    research_project_advisor,
    search_openalex
)


# ============================================================
# FLASK APP
# ============================================================

app = Flask(__name__)


# ============================================================
# CORS
# ============================================================

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://127.0.0.1:5173"
            ],
            "methods": [
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "OPTIONS"
            ],
            "allow_headers": [
                "Content-Type",
                "Authorization"
            ],
            "supports_credentials": True
        }
    },
    supports_credentials=True
)


# ============================================================
# GLOBAL CORS SAFEGUARD
# ============================================================

@app.after_request
def add_cors_headers(response):

    origin = request.headers.get("Origin")

    if origin in [
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ]:

        response.headers["Access-Control-Allow-Origin"] = origin

        response.headers["Access-Control-Allow-Credentials"] = "true"

        response.headers["Access-Control-Allow-Headers"] = (
            "Content-Type, Authorization"
        )

        response.headers["Access-Control-Allow-Methods"] = (
            "GET, POST, PUT, DELETE, OPTIONS"
        )

        response.headers["Vary"] = "Origin"

    return response


# ============================================================
# HOME
# ============================================================

@app.route("/")
def home():

    return jsonify({
        "message": "ResearchIQ backend is running"
    })


# ============================================================
# RESEARCH GENERATOR
# ============================================================

@app.route("/api/research", methods=["POST"])
def research():

    try:

        data = request.get_json() or {}

        topic = data.get(
            "topic",
            ""
        ).strip()

        if not topic:

            return jsonify({
                "error": "Research topic is required"
            }), 400

        result = generate_research_response(
            topic
        )

        return jsonify(result)

    except Exception as e:

        print(
            "RESEARCH ERROR:",
            str(e)
        )

        return jsonify({
            "error": str(e)
        }), 500


# ============================================================
# KAGGLE DATASET SEARCH
# ============================================================

@app.route(
    "/api/kaggle/search",
    methods=["POST"]
)
def kaggle_search():

    try:

        data = request.get_json() or {}

        query = data.get(
            "query",
            ""
        ).strip()

        category = data.get(
            "category",
            "All"
        ).strip()

        sort_by = data.get(
            "sort_by",
            "hottest"
        ).strip()

        limit = data.get(
            "limit",
            10
        )

        if not query:

            return jsonify({
                "success": False,
                "error": "Kaggle search query is required."
            }), 400

        result = search_datasets(
            query=query,
            category=category,
            sort_by=sort_by,
            limit=limit
        )

        return jsonify(
            result
        ), 200

    except Exception as e:

        print(
            "KAGGLE SEARCH ERROR:",
            str(e)
        )

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ============================================================
# KAGGLE DATASET DETAILS
# ============================================================

@app.route(
    "/api/kaggle/dataset/<path:dataset_ref>",
    methods=["GET"]
)
def kaggle_dataset_details(
    dataset_ref
):

    try:

        result = get_dataset_details(
            dataset_ref
        )

        return jsonify({

            "success": True,

            "dataset": result

        }), 200

    except Exception as e:

        print(
            "KAGGLE DATASET DETAILS ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


# ============================================================
# KAGGLE DATASET DOWNLOAD
# ============================================================

@app.route(
    "/api/kaggle/download",
    methods=["POST"]
)
def kaggle_download():

    try:

        data = request.get_json() or {}

        dataset_ref = data.get(
            "dataset_ref",
            ""
        ).strip()

        extract = data.get(
            "extract",
            True
        )

        if not dataset_ref:

            return jsonify({

                "success": False,

                "error": "dataset_ref is required."

            }), 400

        result = download_dataset(
            dataset_ref=dataset_ref,
            extract=extract
        )

        return jsonify(
            result
        ), 200

    except Exception as e:

        print(
            "KAGGLE DOWNLOAD ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


# ============================================================
# KAGGLE CONNECTION TEST
# ============================================================

@app.route(
    "/api/kaggle/health",
    methods=["GET"]
)
def kaggle_health():

    try:

        result = test_kaggle_connection()

        status_code = (
            200
            if result.get("success")
            else 500
        )

        return jsonify(
            result
        ), status_code

    except Exception as e:

        print(
            "KAGGLE HEALTH ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


# ============================================================
# OPENALEX
# RESEARCH PROJECT ADVISOR
# ============================================================

@app.route(
    "/api/openalex/advisor",
    methods=["POST"]
)
def openalex_advisor():

    try:

        data = request.get_json() or {}

        # ----------------------------------------------------
        # USER ADVISOR INPUTS
        # ----------------------------------------------------

        languages = data.get(
            "programming_languages",
            data.get(
                "languages",
                []
            )
        )

        field = data.get(
            "research_field",
            data.get(
                "field",
                ""
            )
        )

        domain = data.get(
            "domain",
            ""
        )

        interests = data.get(
            "research_interests",
            data.get(
                "interests",
                ""
            )
        )

        methodology = data.get(
            "preferred_methodology",
            data.get(
                "methodology",
                ""
            )
        )

        experience_level = data.get(
            "experience_level",
            ""
        )

        # ----------------------------------------------------
        # NORMALIZE LANGUAGES
        # ----------------------------------------------------

        if isinstance(
            languages,
            str
        ):

            languages = [
                language.strip()
                for language in languages.split(",")
                if language.strip()
            ]

        elif not isinstance(
            languages,
            list
        ):

            languages = []

        # ----------------------------------------------------
        # NORMALIZE TEXT VALUES
        # ----------------------------------------------------

        field = (
            str(field).strip()
            if field is not None
            else ""
        )

        domain = (
            str(domain).strip()
            if domain is not None
            else ""
        )

        interests = (
            str(interests).strip()
            if interests is not None
            else ""
        )

        methodology = (
            str(methodology).strip()
            if methodology is not None
            else ""
        )

        experience_level = (
            str(experience_level).strip()
            if experience_level is not None
            else ""
        )

        # ----------------------------------------------------
        # VALIDATION
        # ----------------------------------------------------

        if not languages:

            return jsonify({

                "success": False,

                "error":
                    "At least one programming language is required.",

                "suggestions": [],

                "supporting_works": []

            }), 400

        if not field:

            return jsonify({

                "success": False,

                "error":
                    "Research field is required.",

                "suggestions": [],

                "supporting_works": []

            }), 400

        # ----------------------------------------------------
        # CALL OPENALEX ADVISOR SERVICE
        # ----------------------------------------------------

        result = research_project_advisor(

            languages=languages,

            field=field,

            domain=domain,

            interests=interests,

            methodology=methodology,

            experience_level=experience_level

        )

        # ----------------------------------------------------
        # SERVICE ERROR
        # ----------------------------------------------------

        if not result.get(
            "success",
            False
        ):

            return jsonify(
                result
            ), 500

        # ----------------------------------------------------
        # RETURN ADVISOR RESULT
        # ----------------------------------------------------

        return jsonify(
            result
        ), 200

    except Exception as e:

        print(
            "OPENALEX ADVISOR ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "error": str(e),

            "suggestions": [],

            "supporting_works": []

        }), 500


# ============================================================
# OPENALEX
# DIRECT SEARCH
# ============================================================

@app.route(
    "/api/openalex/search",
    methods=["POST"]
)
def openalex_search():

    try:

        data = request.get_json() or {}

        query = data.get(
            "query",
            data.get(
                "topic",
                ""
            )
        ).strip()

        limit = data.get(
            "limit",
            10
        )

        if not query:

            return jsonify({

                "success": False,

                "error":
                    "OpenAlex search query is required.",

                "results": []

            }), 400

        result = search_openalex(
            search_query=query,
            limit=limit
        )

        return jsonify(
            result
        ), 200

    except Exception as e:

        print(
            "OPENALEX SEARCH ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "error": str(e),

            "results": []

        }), 500


# ============================================================
# OPENCITATIONS
# UPLOAD RESEARCH PAPER
# ============================================================

@app.route(
    "/api/opencitations/upload-paper",
    methods=["POST", "OPTIONS"]
)
def opencitations_upload_paper():

    # --------------------------------------------------------
    # HANDLE CORS PREFLIGHT REQUEST
    # --------------------------------------------------------

    if request.method == "OPTIONS":

        return jsonify({
            "success": True
        }), 200

    try:

        # ----------------------------------------------------
        # upload_paper() already reads the uploaded file
        # directly from Flask's request.files.
        #
        # DO NOT pass the file as an argument because the
        # service function is defined with zero parameters.
        # ----------------------------------------------------

        result = upload_paper()

        # ----------------------------------------------------
        # The OpenCitations service handles the upload and
        # returns the appropriate Flask response.
        # ----------------------------------------------------

        return result

    except Exception as e:

        print(
            "OPENCITATIONS UPLOAD PAPER ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


# ============================================================
# OPENCITATIONS
# RESEARCH PAPER QUESTION ANSWERING
# ============================================================

@app.route(
    "/api/opencitations/ask",
    methods=["POST"]
)
def opencitations_ask():

    try:

        data = request.get_json() or {}

        question = data.get(
            "question",
            ""
        ).strip()

        if not question:

            return jsonify({

                "success": False,

                "error": "Question is required."

            }), 400

        paper = data.get(
            "paper"
        ) or {}

        if not paper:

            return jsonify({

                "success": False,

                "error": "Research paper is required."

            }), 400

        identifier = data.get(
            "identifier",
            ""
        )

        if identifier:
            paper["identifier"] = identifier

        document_id = data.get(
            "document_id"
        )

        if document_id:
            paper["document_id"] = document_id

        # ----------------------------------------------------
        # PDF / DOCUMENT CONTENT
        # ----------------------------------------------------

        pdf_text = data.get(
            "pdf_text"
        )

        if pdf_text:
            paper["pdf_text"] = pdf_text

        extracted_text = data.get(
            "extracted_text"
        )

        if extracted_text:
            paper["extracted_text"] = extracted_text

        full_text = data.get(
            "full_text"
        )

        if full_text:
            paper["full_text"] = full_text

        content = data.get(
            "content"
        )

        if content:
            paper["content"] = content

        page_text = data.get(
            "page_text"
        )

        if page_text:
            paper["page_text"] = page_text

        # ----------------------------------------------------
        # PDF / VIEW / DOWNLOAD INFORMATION
        # ----------------------------------------------------

        pdf_url = data.get(
            "pdf_url"
        )

        if pdf_url:
            paper["pdf_url"] = pdf_url

        view_url = data.get(
            "view_url"
        )

        if view_url:
            paper["view_url"] = view_url

        download_url = data.get(
            "download_url"
        )

        if download_url:
            paper["download_url"] = download_url

        result = ask_question(
            paper=paper,
            question=question
        )

        if not result.get(
            "success"
        ):

            return jsonify(
                result
            ), 500

        citation_information = result.get(
            "citation_information",
            {}
        )

        return jsonify({

            "success": True,

            "question":
                result.get(
                    "question",
                    question
                ),

            "answer":
                result.get(
                    "answer",
                    ""
                ),

            "explanation":
                (
                    "The answer is generated from the "
                    "selected research paper, available "
                    "PDF content and its available "
                    "citation information."
                ),

            "context":
                (
                    "The response is grounded in the "
                    "paper metadata, abstract, supplied "
                    "PDF/document content and "
                    "OpenCitations information."
                ),

            "sources": [],

            "paper":
                result.get(
                    "paper",
                    paper
                ),

            "citation_information":
                citation_information,

            "citation_count":
                citation_information.get(
                    "citation_count",
                    0
                ),

            "reference_count":
                citation_information.get(
                    "reference_count",
                    0
                ),

            "incoming_citation_count":
                citation_information.get(
                    "incoming_citation_count",
                    0
                ),

            "outgoing_reference_count":
                citation_information.get(
                    "outgoing_reference_count",
                    0
                ),

            "source":
                result.get(
                    "source",
                    "Research IQ"
                ),

            "answer_format":
                result.get(
                    "answer_format",
                    "5 lines"
                ),

            "timestamp":
                result.get(
                    "timestamp"
                )

        }), 200

    except Exception as e:

        print(
            "OPENCITATIONS ASK ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


# ============================================================
# OPENCITATIONS
# PAPER INFORMATION
# ============================================================

@app.route(
    "/api/opencitations/paper-information",
    methods=["POST"]
)
def opencitations_paper_information():

    try:

        data = request.get_json() or {}

        paper = data.get(
            "paper"
        ) or {}

        if not paper:

            return jsonify({

                "success": False,

                "error": "Research paper is required."

            }), 400

        identifier = data.get(
            "identifier",
            ""
        )

        if identifier:
            paper["identifier"] = identifier

        # ----------------------------------------------------
        # Preserve PDF / document information if supplied
        # ----------------------------------------------------

        pdf_text = data.get(
            "pdf_text"
        )

        if pdf_text:
            paper["pdf_text"] = pdf_text

        extracted_text = data.get(
            "extracted_text"
        )

        if extracted_text:
            paper["extracted_text"] = extracted_text

        full_text = data.get(
            "full_text"
        )

        if full_text:
            paper["full_text"] = full_text

        content = data.get(
            "content"
        )

        if content:
            paper["content"] = content

        page_text = data.get(
            "page_text"
        )

        if page_text:
            paper["page_text"] = page_text

        pdf_url = data.get(
            "pdf_url"
        )

        if pdf_url:
            paper["pdf_url"] = pdf_url

        view_url = data.get(
            "view_url"
        )

        if view_url:
            paper["view_url"] = view_url

        download_url = data.get(
            "download_url"
        )

        if download_url:
            paper["download_url"] = download_url

        result = get_paper_information(
            paper
        )

        if not result.get(
            "success"
        ):

            return jsonify(
                result
            ), 500

        citation_information = result.get(
            "citation_information",
            {}
        )

        return jsonify({

            "success": True,

            "paper":
                result.get(
                    "paper",
                    paper
                ),

            "citation_information":
                citation_information,

            "citation_count":
                citation_information.get(
                    "citation_count",
                    0
                ),

            "reference_count":
                citation_information.get(
                    "reference_count",
                    0
                ),

            "incoming_citation_count":
                citation_information.get(
                    "incoming_citation_count",
                    0
                ),

            "outgoing_reference_count":
                citation_information.get(
                    "outgoing_reference_count",
                    0
                ),

            "source":
                "OpenCitations"

        }), 200

    except Exception as e:

        print(
            "OPENCITATIONS PAPER INFORMATION ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


# ============================================================
# OPENCITATIONS
# PAPER SUMMARY
# ============================================================

@app.route(
    "/api/opencitations/summarize",
    methods=["POST"]
)
def opencitations_summarize():

    try:

        data = request.get_json() or {}

        paper = data.get(
            "paper"
        ) or {}

        if not paper:

            return jsonify({

                "success": False,

                "error": "Research paper is required."

            }), 400

        identifier = data.get(
            "identifier",
            ""
        )

        if identifier:
            paper["identifier"] = identifier

        document_id = data.get(
            "document_id"
        )

        if document_id:
            paper["document_id"] = document_id

        # ----------------------------------------------------
        # PDF / DOCUMENT CONTENT
        # ----------------------------------------------------

        pdf_text = data.get(
            "pdf_text"
        )

        if pdf_text:
            paper["pdf_text"] = pdf_text

        extracted_text = data.get(
            "extracted_text"
        )

        if extracted_text:
            paper["extracted_text"] = extracted_text

        full_text = data.get(
            "full_text"
        )

        if full_text:
            paper["full_text"] = full_text

        content = data.get(
            "content"
        )

        if content:
            paper["content"] = content

        page_text = data.get(
            "page_text"
        )

        if page_text:
            paper["page_text"] = page_text

        # ----------------------------------------------------
        # PDF / VIEW / DOWNLOAD INFORMATION
        # ----------------------------------------------------

        pdf_url = data.get(
            "pdf_url"
        )

        if pdf_url:
            paper["pdf_url"] = pdf_url

        view_url = data.get(
            "view_url"
        )

        if view_url:
            paper["view_url"] = view_url

        download_url = data.get(
            "download_url"
        )

        if download_url:
            paper["download_url"] = download_url

        result = summarize_paper(
            paper
        )

        if not result.get(
            "success"
        ):

            return jsonify(
                result
            ), 500

        citation_information = result.get(
            "citation_information",
            {}
        )

        return jsonify({

            "success": True,

            "question":
                result.get(
                    "question",
                    ""
                ),

            "answer":
                result.get(
                    "answer",
                    ""
                ),

            "explanation":
                (
                    "The summary is generated from the "
                    "selected research paper, available "
                    "PDF content and its available "
                    "citation information."
                ),

            "context":
                (
                    "The response is grounded in the "
                    "paper metadata, abstract, supplied "
                    "PDF/document content and "
                    "OpenCitations information."
                ),

            "sources": [],

            "paper":
                result.get(
                    "paper",
                    paper
                ),

            "citation_information":
                citation_information,

            "citation_count":
                citation_information.get(
                    "citation_count",
                    0
                ),

            "reference_count":
                citation_information.get(
                    "reference_count",
                    0
                ),

            "incoming_citation_count":
                citation_information.get(
                    "incoming_citation_count",
                    0
                ),

            "outgoing_reference_count":
                citation_information.get(
                    "outgoing_reference_count",
                    0
                ),

            "source":
                result.get(
                    "source",
                    "Research IQ"
                ),

            "answer_format":
                result.get(
                    "answer_format",
                    "5 lines"
                ),

            "timestamp":
                result.get(
                    "timestamp"
                )

        }), 200

    except Exception as e:

        print(
            "OPENCITATIONS SUMMARIZE ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


# ============================================================
# OPENCITATIONS
# SERVICE HEALTH CHECK
# ============================================================

@app.route(
    "/api/opencitations/health",
    methods=["GET"]
)
def opencitations_health():

    try:

        from services.opencitations_service import (
            check_api
        )

        result = check_api()

        status_code = (
            200
            if result.get("status") == "ok"
            else 500
        )

        return jsonify(
            result
        ), status_code

    except Exception as e:

        print(
            "OPENCITATIONS HEALTH ERROR:",
            str(e)
        )

        return jsonify({

            "status": "error",

            "message": str(e)

        }), 500

# ============================================================
# DSAA DASHBOARD
# ============================================================

from api.dashboard_routes import dashboard_bp

app.register_blueprint(dashboard_bp)

# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )