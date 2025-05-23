check:
	ruff check . --fix
	black .
	mypy src/
	pytest tests/
