import asyncio

from graph_refinement.core.worker import GraphRefinementWorker


def main() -> None:
    worker = GraphRefinementWorker()
    exit_code = asyncio.run(worker.start())
    raise SystemExit(exit_code)


if __name__ == "__main__":
    main()
