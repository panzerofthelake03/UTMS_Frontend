import axiosInstance from './axiosInstance';

export interface CreateTicketRequest {
  subject: string;
  category: string;
  message: string;
}

export interface TicketResponse {
  id: number;
  subject: string;
  category: string;
  message: string;
  ticketStatus: string;
  createdAt: string;
}

export const supportApi = {
  createTicket: (data: CreateTicketRequest) =>
    axiosInstance.post<{ data: TicketResponse }>('/api/support/tickets', data),
};
