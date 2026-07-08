"""Deploy-asset guards: files the running service reads MUST ship in the
Docker image. The July 2026 scoring regression happened exactly here: the
image excluded data/, the reviewer rubric fell back to an empty prompt list,
and every concept in a real report scored ~1.7/10."""

import re
from pathlib import Path

_BACKEND = Path(__file__).resolve().parents[1]


def test_docker_image_ships_the_creative_knowledge_base() -> None:
    knowledge_base = _BACKEND / "data" / "vantage-creative-knowledge-base.json"
    assert knowledge_base.exists()

    dockerfile = (_BACKEND / "Dockerfile").read_text(encoding="utf-8")
    assert re.search(r"^COPY .*\bdata \./data$", dockerfile, re.MULTILINE), (
        "Dockerfile must COPY data/ into the image; graph.py reads the"
        " knowledge base at runtime for the reviewer rubric and playbook"
    )

    dockerignore = (_BACKEND / ".dockerignore").read_text(encoding="utf-8")
    assert not re.search(r"^data/?\s*$", dockerignore, re.MULTILINE), (
        ".dockerignore must not exclude data/ (that exclusion caused the"
        " ~1.7/10 concept-score regression)"
    )
