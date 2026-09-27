import importlib
import inspect
import pkgutil

from graph_refinement.core.executor import BaseExecutor
from graph_refinement.executors.base import GenericNodeBase


def _collect_executors() -> list[type[BaseExecutor]]:
    found_executors = []

    for _, module_name, _ in pkgutil.iter_modules(__path__):
        if module_name == "base":
            continue

        module = importlib.import_module(f"{__name__}.{module_name}")

        # 尋找該模組內所有繼承自 BaseExecutor 的類別
        for _, obj in inspect.getmembers(module, inspect.isclass):
            if (
                issubclass(obj, BaseExecutor)
                and obj is not BaseExecutor
                and obj is not GenericNodeBase
                and obj.__module__ == module.__name__
            ):
                found_executors.append(obj)

    return found_executors


def load_executors() -> dict[str, BaseExecutor]:
    """Load and instantiate all BaseExecutor implementations."""
    executors_map: dict[str, BaseExecutor] = {}

    for executor_class in _collect_executors():
        executor = executor_class()

        executors_map[executor_class.__name__] = executor

        for task_type in getattr(executor_class, "TASK_TYPES", []):
            executors_map[task_type] = executor

    return executors_map
