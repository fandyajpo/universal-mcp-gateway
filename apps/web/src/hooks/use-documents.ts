"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type UseQueryResult,
  type UseMutationResult,
  type InfiniteData,
} from "@tanstack/react-query";

import {
  listDocumentsAction,
  getDocumentAction,
  deleteDocumentAction,
  retryDocumentAction,
} from "@/actions/documents/pdf";

import type { PdfDocument } from "@repo/types";

interface UseDocumentsOptions {
  status?: string;
  search?: string;
  limit?: number;
}

interface PageData {
  documents: PdfDocument[];
  nextCursor?: string;
  total: number;
}

export function useDocuments(
  workspaceId: string,
  options?: UseDocumentsOptions,
): {
  documents: PdfDocument[];
  total: number;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  error: Error | null;
  fetchNextPage: () => void;
  hasNextPage: boolean;
} {
  const queryKey = ["documents", workspaceId, options] as const;

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const result = await listDocumentsAction(workspaceId, {
        ...options,
        cursor: pageParam,
      });
      if (!result.success) {
        throw new Error(result.error ?? "Failed to load documents");
      }
      return { documents: result.documents ?? [], nextCursor: result.nextCursor, total: result.total ?? 0 };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!workspaceId,
    staleTime: 10_000,
    gcTime: 60_000,
    retry: 2,
    refetchInterval: (query) => {
      const allDocs = query.state.data?.pages.flatMap((p) => p.documents) ?? [];
      const hasProcessing = allDocs.some((d) => d.status === "processing" || d.status === "uploading");
      return hasProcessing ? 2000 : false;
    },
  });

  const documents = query.data?.pages.flatMap((p) => p.documents) ?? [];
  const total = query.data?.pages[0]?.total ?? documents.length;

  return {
    documents,
    total,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    error: query.error,
    fetchNextPage: (): void => { void query.fetchNextPage(); },
    hasNextPage: query.hasNextPage,
  };
}

export function useDocument(documentId: string): UseQueryResult<PdfDocument> {
  return useQuery({
    queryKey: ["document", documentId],
    queryFn: async () => {
      const result = await getDocumentAction(documentId);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to load document");
      }
      if (!result.document) {
        throw new Error("Document not found");
      }
      return result.document;
    },
    enabled: !!documentId,
    staleTime: 10_000,
    gcTime: 60_000,
    retry: 2,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      return data.status === "processing" || data.status === "uploading" ? 2000 : false;
    },
  });
}

export function useDeleteDocument(workspaceId: string): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const result = await deleteDocumentAction(documentId);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to delete document");
      }
    },
    onMutate: async (documentId: string) => {
      await queryClient.cancelQueries({ queryKey: ["documents", workspaceId] });

      queryClient.setQueriesData<InfiniteData<PageData>>(
        { queryKey: ["documents", workspaceId] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              documents: page.documents.filter((d) => d.id !== documentId),
              total: Math.max(0, page.total - 1),
            })),
          };
        },
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents", workspaceId] });
    },
  });
}

export function useRetryDocument(workspaceId: string): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const result = await retryDocumentAction(documentId);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to retry document");
      }
    },
    onMutate: async (documentId: string) => {
      await queryClient.cancelQueries({ queryKey: ["documents", workspaceId] });

      queryClient.setQueriesData<InfiniteData<PageData>>(
        { queryKey: ["documents", workspaceId] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              documents: page.documents.map((d) =>
                d.id === documentId ? { ...d, status: "processing" as const, progress: 0, error: undefined } : d,
              ),
            })),
          };
        },
      );

      queryClient.setQueryData<PdfDocument>(["document", documentId], (old) => {
        if (!old) return old;
        return { ...old, status: "processing" as const, progress: 0, error: undefined };
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents", workspaceId] });
    },
  });
}

