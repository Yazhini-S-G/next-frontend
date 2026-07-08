"use client";

import { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import RequireAuth from "@/components/RequireAuth";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import Badge from "@/components/Badge";
import { api, hasPermission, imageUrl } from "@/lib/api";
import Image from "next/image";

const stripHtml = (html) => {
  if (globalThis.window === undefined) return "";
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  return doc.body.textContent || "";
};

export default function BlogsPage() {
  return (
    <RequireAuth permission="view_blog">
      {(user) => <Blogs user={user} />}
    </RequireAuth>
  );
}

function Blogs({ user }) {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ search: "", status_filter: "", category_id: "" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const [nextBlogs, nextCategories] = await Promise.all([
    api(`/blogs${params.toString() ? `?${params.toString()}` : ""}`),
    api("/blogs/categories"),
  ]);

  setBlogs(nextBlogs);
  setCategories(nextCategories);
}, [filters]);

  useEffect(() => {
  load().catch((err) => setError(err.message));
}, [load]);
  async function remove(id) {
    if (!confirm("Delete this blog?")) return;
    await api(`/blogs/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <>
      <PageHeader 
        title="Blogs" 
        description="Create drafts, upload images, submit for review, and publish when permitted."
      >
        {hasPermission(user, "create_blog") && <button className="btn primary" onClick={() => setEditing({})}>Create Blog</button>}
      </PageHeader>
      <div className="toolbar card">
        <input aria-label="Search blogs" placeholder="Search" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        <select aria-label="Filter by status" value={filters.status_filter} onChange={(event) => setFilters({ ...filters, status_filter: event.target.value })}>
          <option value="">All Statuses</option>
          <option>Draft</option>
          <option>Pending Review</option>
          <option>Approved</option>
          <option>Published</option>
          <option>Rejected</option>
        </select>
        <select aria-label="Filter by category" value={filters.category_id} onChange={(event) => setFilters({ ...filters, category_id: event.target.value })}>
          <option value="">All Categories</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </div>
      {error && <div className="empty-state">{error}</div>}
      <section className="grid blog-grid" style={{ marginTop: 18 }}>
        {blogs.map((blog) => (
          <article className="card blog-card" key={blog.id}>
            {blog.featured_image && (
              <Image
              className="blog-thumb"
              src={imageUrl(blog.featured_image)}
              alt={blog.title}
              width={400}
              height={250}
            />
          )}
            <Badge>{blog.status}</Badge>
            {blog.is_featured && <Badge variant="warning">Featured</Badge>}
            <h3>{blog.title}</h3>
            <p className="muted">{stripHtml(blog.content).slice(0, 150)}</p>
            <p className="muted">{blog.category_name || "Uncategorized"} | {blog.tags || "No tags"}</p>
            <div className="actions">
              {(hasPermission(user, "edit_blog") || blog.author_id === user.id) && <button className="btn" onClick={() => setEditing(blog)}>Edit</button>}
              {hasPermission(user, "delete_blog") && <button className="btn danger" onClick={() => remove(blog.id)}>Delete</button>}
            </div>
          </article>
        ))}
      </section>
      {blogs.length === 0 && <div className="empty-state">No blogs found.</div>}
      {editing && <BlogModal blog={editing} categories={categories} user={user} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await load(); }} />}
    </>
  );
}

Blogs.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    email: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.string),
    permissions: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};

function BlogModal({ blog, categories, user, onClose, onSaved }) {
  const [preview, setPreview] = useState(blog.featured_image ? imageUrl(blog.featured_image) : "");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const isEdit = Boolean(blog.id);

  async function uploadIfNeeded() {
    if (!file) return blog.featured_image || null;
    const form = new FormData();
    form.append("file", file);
    const result = await api("/blogs/upload-image", { method: "POST", body: form });
    return result.path;
  }

  async function save(event, action) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget.form || event.currentTarget);
    try {
      const featured_image = await uploadIfNeeded();
      const payload = {
        title: form.get("title"),
        content: form.get("content"),
        category_id: form.get("category_id") ? Number(form.get("category_id")) : null,
        tags: form.get("tags"),
        featured_image,
        action,
      };
      await api(isEdit ? `/blogs/${blog.id}` : "/blogs", { method: isEdit ? "PUT" : "POST", body: JSON.stringify(payload) });
      await onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal title={isEdit ? "Edit Blog" : "Create Blog"} onClose={onClose}>
        <div className="grid two-col">
          <div>
            <div className="field"><label htmlFor="blog-title">Title</label><input id="blog-title" name="title" defaultValue={blog.title || ""} required /></div>
            <div className="field"><label htmlFor="blog-category">Category</label><select id="blog-category" name="category_id" defaultValue={blog.category_id || ""}><option value="">Uncategorized</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
            <div className="field"><label htmlFor="blog-tags">Tags</label><input id="blog-tags" name="tags" defaultValue={blog.tags || ""} /></div>
            <div className="field"><label htmlFor="blog-featured-image">Featured Image</label><input id="blog-featured-image" type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(event) => { const nextFile = event.target.files?.[0]; setFile(nextFile || null); if (nextFile) setPreview(URL.createObjectURL(nextFile)); }} /></div>
            {preview && (
              <Image
              className="blog-thumb"
              src={preview}
              alt="Featured preview"
              width={400}
              height={250}
              unoptimized
            />
          )}
          </div>
          <div className="field"><label htmlFor="blog-content">Content</label><textarea id="blog-content" name="content" defaultValue={blog.content || ""} required /></div>
        </div>
        <div className="error">{error}</div>
        <div className="actions">
          {hasPermission(user, "save_draft") && <button className="btn" type="button" onClick={(event) => save(event, "draft")}>Save Draft</button>}
          {hasPermission(user, "submit_for_review") && <button className="btn secondary" type="button" onClick={(event) => save(event, "submit")}>Submit For Review</button>}
          {hasPermission(user, "publish_blog") && <button className="btn primary" type="button" onClick={(event) => save(event, "publish")}>Publish</button>}
        </div>
    </Modal>
  );
}

BlogModal.propTypes = {
  blog: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    content: PropTypes.string,
    category_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    tags: PropTypes.string,
    featured_image: PropTypes.string,
    status: PropTypes.string,
    is_featured: PropTypes.bool,
    author_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    category_name: PropTypes.string,
    author_name: PropTypes.string,
  }).isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    permissions: PropTypes.arrayOf(PropTypes.string),
    roles: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
};


