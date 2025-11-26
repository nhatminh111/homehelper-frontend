import React from "react";
import { Button, Form } from "react-bootstrap";

export default function MediaUpload({ label, photos, setPhotos }) {
  const handleFilesChange = (event) => {
    const files = event.target.files;
    if (!files) return;
    const newPhotos = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const removePhoto = (index) => {
    setPhotos((prev) => {
      const clone = [...prev];
      const [removed] = clone.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.preview);
      return clone;
    });
  };

  return (
    <div>
      <h6 className="text-muted mb-3">{label}</h6>
      <label
        className="d-flex flex-column align-items-center justify-content-center border border-dashed rounded-3 py-5 text-center text-muted"
        style={{ cursor: "pointer", borderColor: "#d8dbe0" }}
      >
        <i className="bi bi-cloud-arrow-up fs-1 mb-2"></i>
        <span className="fw-semibold">Drag & drop photos here</span>
        <small className="text-muted">or click to browse</small>
        <Form.Control
          type="file"
          multiple
          accept="image/*"
          onChange={handleFilesChange}
          className="d-none"
        />
      </label>
      <div className="d-flex flex-wrap gap-3 mt-3">
        {photos.map((item, index) => {
          const src = item.preview || item.url || item.photoUrl || null;
          const key = item.preview || item.url || `${index}`;
          return (
            <div
              key={key}
              className="position-relative rounded overflow-hidden"
              style={{ width: 120, height: 90 }}
            >
              {src ? (
                <img
                  src={src}
                  alt={label}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  className="d-flex align-items-center justify-content-center bg-light text-muted"
                  style={{ width: "100%", height: "100%" }}
                >
                  No preview
                </div>
              )}
              <Button
                variant="light"
                size="sm"
                className="position-absolute top-0 end-0 m-1 p-1"
                onClick={() => removePhoto(index)}
              >
                <i className="bi bi-x-lg"></i>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
