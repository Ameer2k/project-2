const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const multer = require("multer");

const uploadDirectory = path.join(__dirname, "..", "public", "uploads");

function createUploader(maxFileSize, allowedTypes) {
  return multer({
    storage: multer.diskStorage({
      destination: uploadDirectory,
      filename: (req, file, done) => {
        const extension = path.extname(file.originalname).toLowerCase();
        done(null, crypto.randomUUID() + extension);
      },
    }),
    limits: { fileSize: maxFileSize },
    fileFilter: (req, file, done) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const mimeType = allowedTypes[extension];
      if (!mimeType || file.mimetype !== mimeType) {
        const error = new Error("Unsupported uploaded file type.");
        error.code = "UNSUPPORTED_UPLOAD_TYPE";
        return done(error);
      }

      done(null, true);
    },
  });
}

async function removeUploadedFiles(files) {
  await Promise.all(
    files.map(async (file) => {
      if (!file.filename) return;

      try {
        await fs.unlink(
          path.join(uploadDirectory, path.basename(file.filename)),
        );
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }),
  );
}

async function removeUploadedPaths(paths) {
  const files = paths
    .filter(
      (value) => typeof value === "string" && value.startsWith("/uploads/"),
    )
    .map((value) => ({ filename: path.basename(value) }));

  await removeUploadedFiles(files);
}

module.exports = { createUploader, removeUploadedFiles, removeUploadedPaths };
