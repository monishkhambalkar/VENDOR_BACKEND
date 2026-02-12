const { NextFunction, Request, Response } = require("express");
const cloudinary = require("../config/cloudinary");
const path = require("node:path");
const fs = require("node:fs");
const createHttpError = require("http-errors");
const bookModel = require("./bookModel");
const { AuthRequest } = require("../middlewares/authenticate");

const createBook = async (req, res, next) => {
  const { title, genre } = req.body;
  const files = req.files;

  const coverImageMineType = files.coverImage[0].mimetype.split("/").at(-1);
  const fileName = files.coverImage[0].filename;

  const filePath = path.resolve(__dirname, "../../../uploads/admin", fileName);

  try {
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: fileName,
      folder: "book-covers",
      format: coverImageMineType,
    });

    const bookFileName = files.file[0].filename;
    const bookFilePath = path.resolve(
      __dirname,
      "../../../uploads/admin",
      bookFileName
    );

    const bookFileUploadResult = await cloudinary.uploader.upload(
      bookFilePath,
      {
        resource_type: "raw",
        filename_override: bookFileName,
        folder: "book-Pdfs",
        format: "pdf",
      }
    );

    const _req = req;

    const newBook = await bookModel.create({
      title,
      genre,
      author: _req.userId,
      coverImage: uploadResult.secure_url,
      file: bookFileUploadResult.secure_url,
    });

    await fs.promises.unlink(filePath);
    await fs.promises.unlink(bookFilePath);

    res.status(201).json({ id: newBook._id });
  } catch (error) {
    console.log(error);
    return next(createHttpError(500, "error while uploading the files."));
  }
};

const updateBook = async (req, res, next) => {
  const { title, genre } = req.body;
  const bookId = req.params.bookId;

  const book = await bookModel.findOne({ _id: bookId });
  if (!book) {
    return next(createHttpError(404, "book not found"));
  }

  const _req = req;

  if (book.author.toString() !== _req.userId) {
    return next(createHttpError(403, "Unauthorized"));
  }

  const files = req.files;
  let completeCoverImage = "";

  try {
    if (files.coverImage) {
      const filename = files.coverImage[0].filename;
      const coverMimeType = files.coverImage[0].mimetype.split("/").at(1);
      const filePath = path.resolve(
        __dirname,
        "../../../uploads/admin/" + filename
      );

      completeCoverImage = filename;

      const uploadResult = await cloudinary.uploader.upload(filePath, {
        filename_override: completeCoverImage,
        folder: "book-covers",
        format: coverMimeType,
      });
      completeCoverImage = uploadResult.secure_url;
      await fs.promises.unlink(filePath);
    }

    let completeFileName = "";

    if (files.file) {
      const bookFilePath = path.resolve(
        __dirname,
        "../../../uploads/admin/" + files.file[0].filename
      );

      const bookFileName = files.file[0].filename;
      completeFileName = `${bookFileName}.pdf`;
      const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath, {
        resource_type: "raw",
        filename_override: completeFileName,
        folder: "book-pdfs",
        format: "pdf",
      });

      completeFileName = uploadResultPdf.secure_url;
      await fs.promises.unlink(bookFilePath);
    }

    const updateBook = await bookModel.findOneAndUpdate(
      { _id: bookId },
      {
        title: title,
        genre: genre,
        coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
        file: completeFileName ? completeFileName : book.file,
      },
      { new: true }
    );
    res.json(updateBook);
  } catch (error) {
    console.log(error);
  }
};

const listBooks = async (req, res, next) => {
  try {
    const book = await bookModel.find();
    res.json(book);
  } catch (error) {
    return next(createHttpError(500, "Error while getting books"));
  }
};

const getSingleBook = async (req, res, next) => {
  const bookId = req.params.bookId;

  try {
    const book = await bookModel.findOne({ _id: bookId });
    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }
    return res.json(book);
  } catch (error) {
    return next(createHttpError(500, "Error while getting books"));
  }
};

const deleteBook = async (req, res, next) => {
  const bookId = req.params.bookId;

  try {
    const book = await bookModel.findOne({ _id: bookId });
    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }

    const _req = req;

    if (book.author.toString() !== _req.userId) {
      return next(createHttpError(403, "Unauthorized"));
    }

    const coverFileSplits = book.coverImage.split("/");
    const coverImagePublicId =
      coverFileSplits.at(-2) + "/" + coverFileSplits.at(-1)?.split(".").at(-2);

    const bookFileSplits = book.file.split("/");
    const bookFileUploadId =
      bookFileSplits.at(-2) + "/" + bookFileSplits.at(-1);

    console.log("bookFileUploadId", bookFileUploadId);

    await cloudinary.uploader.destroy(coverImagePublicId);
    await cloudinary.uploader.destroy(bookFileUploadId, {
      resource_type: "raw",
    });

    await bookModel.deleteOne({ _id: bookId });

    return res.sendStatus(204);
  } catch (error) {
    return next(createHttpError(500, "Error while getting books"));
  }
};

module.exports = {
  createBook,
  updateBook,
  listBooks,
  getSingleBook,
  deleteBook,
};
