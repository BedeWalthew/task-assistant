"""Agent module."""

from .task_agent import TaskAgentService, APP_NAME
from .prompts import SYSTEM_PROMPT

__all__ = ["TaskAgentService", "APP_NAME", "SYSTEM_PROMPT"]
