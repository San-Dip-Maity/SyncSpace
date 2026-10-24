import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(64),
  email: z.string().trim().email("Invalid email address").max(255).toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const signInSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(64),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export const workspaceCreateSchema = z.object({
  name: z.string().trim().min(2, "Workspace name must be at least 2 characters").max(64),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase alphanumeric characters and hyphens")
    .optional(),
  description: z.string().max(256).optional(),
});

export const workspaceUpdateSchema = z.object({
  name: z.string().trim().min(2).max(64).optional(),
  description: z.string().max(256).optional(),
});

export const invitationCreateSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export const folderCreateSchema = z.object({
  name: z.string().trim().min(1, "Folder name is required").max(64),
  parentId: z.string().uuid().nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const folderUpdateSchema = z.object({
  name: z.string().trim().min(1).max(64).optional(),
  parentId: z.string().uuid().nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
});

export const documentCreateSchema = z.object({
  title: z.string().trim().max(128).default("Untitled Document"),
  folderId: z.string().uuid().nullable().optional(),
  contentJson: z.string().optional(),
  contentHtml: z.string().optional(),
});

export const documentUpdateSchema = z.object({
  title: z.string().trim().min(1).max(128).optional(),
  folderId: z.string().uuid().nullable().optional(),
  contentJson: z.string().optional(),
  contentHtml: z.string().optional(),
  isArchived: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
});

export const documentPermissionSchema = z.object({
  email: z.string().trim().email().toLowerCase().optional(),
  userId: z.string().uuid().optional(),
  role: z.enum(["OWNER", "EDITOR", "COMMENTER", "VIEWER"]),
});

export const shareLinkCreateSchema = z.object({
  role: z.enum(["VIEWER", "COMMENTER", "EDITOR"]).default("VIEWER"),
  requiresAuth: z.boolean().default(false),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

export const commentCreateSchema = z.object({
  content: z.string().trim().min(1, "Comment cannot be empty").max(2000),
  parentId: z.string().uuid().nullable().optional(),
});

export const commentUpdateSchema = z.object({
  content: z.string().trim().min(1, "Comment cannot be empty").max(2000),
});

export const versionCreateSchema = z.object({
  title: z.string().trim().min(1).max(128),
  label: z.string().trim().max(64).optional(),
});

export const searchQuerySchema = z.object({
  query: z.string().trim().min(1).max(100),
  folderId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type WorkspaceCreateInput = z.infer<typeof workspaceCreateSchema>;
export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;
export type CommentCreateInput = z.infer<typeof commentCreateSchema>;
