"use client";
import Image from "next/image";

import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import RequireAuth from "@/components/RequireAuth";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";
import { api, hasPermission, imageUrl } from "@/lib/api";

export default function BlogReviewPage() {
  return (
    <RequireAuth permission="review_blog">
      {(user) => <BlogReview user={user} />}
    </RequireAuth>
  );
}

function BlogReview({ user }) {
  const [blogs, setBlogs] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    const items = await api("/blogs?status_filter=Pending+Review");
    setBlogs(items);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function setStatus(id, status) {
    setError("");
    try {
      await api(`/blogs/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function feature(id) {
    setError("");
    try {
      await api(`/blogs/${id}/feature`, { method: "PUT" });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <PageHeader 
        title="Blog Review" 
        description="Approve, reject, publish, and feature submitted blogs according to permissions." 
      />
      {error && <div className="empty-state">{error}</div>}
      <section className="grid blog-grid">
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
            <Badge variant="warning">{blog.status}</Badge>
            <h3>{blog.title}</h3>
            <p className="muted">By {blog.author_name}</p>
            <p>{blog.content.slice(0, 180)}</p>
            <div className="actions">
              <button className="btn secondary" onClick={() => setStatus(blog.id, "Approved")}>Approve</button>
              <button className="btn danger" onClick={() => setStatus(blog.id, "Rejected")}>Reject</button>
              {hasPermission(user, "publish_blog") && <button className="btn primary" onClick={() => setStatus(blog.id, "Published")}>Publish</button>}
              {hasPermission(user, "feature_blog") && <button className="btn" onClick={() => feature(blog.id)}>Feature</button>}
            </div>
          </article>
        ))}
      </section>
      {!blogs.length && <div className="empty-state">No pending blogs.</div>}
    </>
  );
}

BlogReview.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    permissions: PropTypes.arrayOf(PropTypes.string),
    roles: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};
