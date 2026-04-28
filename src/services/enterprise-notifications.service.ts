import { getServerApiBase, requestJson } from "@/lib/http";

export type EnterpriseNotificationType = "ORDER_CREATED";

export type EnterpriseNotification = {
  id: string;
  type: EnterpriseNotificationType;
  title: string;
  body: string | null;
  data: unknown;
  readAt: string | null;
  createdAt: string;
};

export type EnterpriseNotificationsListResponse = {
  success: true;
  notifications: EnterpriseNotification[];
  unreadCount: number;
  nextCursor: string | null;
};

class EnterpriseNotificationsServiceImpl {
  async list(params?: {
    unreadOnly?: boolean;
    cursor?: string;
    limit?: number;
  }): Promise<EnterpriseNotificationsListResponse> {
    const base = getServerApiBase();
    const qs = new URLSearchParams();
    if (params?.unreadOnly) qs.set("unread", "1");
    if (params?.cursor) qs.set("cursor", params.cursor);
    if (typeof params?.limit === "number") qs.set("limit", String(params.limit));
    return requestJson(`${base}/enterprise/notifications?${qs.toString()}`, {
      method: "GET",
      cache: "no-store",
    });
  }

  async markRead(notificationId: string): Promise<{ success: true; updated: number }> {
    const base = getServerApiBase();
    return requestJson(
      `${base}/enterprise/notifications/${encodeURIComponent(notificationId)}/read`,
      {
        method: "PATCH",
        cache: "no-store",
      },
    );
  }

  async markAllRead(): Promise<{ success: true; updated: number }> {
    const base = getServerApiBase();
    return requestJson(`${base}/enterprise/notifications/read-all`, {
      method: "PATCH",
      cache: "no-store",
    });
  }

  async delete(notificationId: string): Promise<{ success: true; deleted: number }> {
    const base = getServerApiBase();
    return requestJson(`${base}/enterprise/notifications/${encodeURIComponent(notificationId)}`, {
      method: "DELETE",
      cache: "no-store",
    });
  }
}

export const enterpriseNotificationsService = new EnterpriseNotificationsServiceImpl();

