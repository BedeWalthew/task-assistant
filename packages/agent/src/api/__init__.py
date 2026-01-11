"""API client module for backend communication."""

from .client import APIClient
from .schemas import (
    Ticket,
    Project,
    CreateTicketRequest,
    UpdateTicketRequest,
    TicketFilter,
    PaginatedTickets,
)

__all__ = [
    "APIClient",
    "Ticket",
    "Project",
    "CreateTicketRequest",
    "UpdateTicketRequest",
    "TicketFilter",
    "PaginatedTickets",
]
