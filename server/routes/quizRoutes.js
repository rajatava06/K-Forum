import express from "express";
import multer from "multer";
import Post from "../models/Post.js";
import { auth } from "../middleware/auth.js";
import { uploadImage } from "../config/cloudinary.js";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Not an image! Please upload only images."), false);
    }
  },
});

const router = express.Router();

router.post("/", auth, upload.array("images", 5), async (req, res) => {
  try {
    const { question, options, correctAnswer, tags, isAnonymous } = req.body;
    const normalizedQuestion = typeof question === "string" ? question.trim() : "";
    const normalizedOptions = Array.isArray(options)
      ? options.map((option) => String(option).trim()).filter(Boolean)
      : typeof options === "string"
        ? (() => {
            try {
              const parsed = JSON.parse(options);
              return Array.isArray(parsed)
                ? parsed.map((option) => String(option).trim()).filter(Boolean)
                : [options.trim()].filter(Boolean);
            } catch {
              return [options.trim()].filter(Boolean);
            }
          })()
        : [];

    if (!normalizedQuestion || normalizedOptions.length < 2 || correctAnswer === undefined || correctAnswer === null) {
      return res.status(400).json({
        message: "Question, at least two options, and the correct answer are required.",
      });
    }

    const manualTags = typeof tags === "string"
      ? tags.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean)
      : Array.isArray(tags)
        ? tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean)
        : [];

    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageUrl = await uploadImage(file.buffer, file.mimetype);
        attachments.push({
          url: imageUrl,
          type: "image",
          filename: file.originalname || "image",
        });
      }
    }

    const post = new Post({
      title: normalizedQuestion,
      content: normalizedQuestion,
      author: req.userId,
      category: "qna",
      tags: manualTags,
      isAnonymous: isAnonymous === true || isAnonymous === "true",
      isQuiz: true,
      attachments,
      status: "PUBLISHED",
      moderationStatus: "approved",
      moderation: {
        isUnsafe: false,
        confidence: 0,
        categories: [],
        flaggedWords: [],
        language: "unknown"
      },
      quiz: {
        question: normalizedQuestion,
        options: normalizedOptions,
        correctAnswer: Number(correctAnswer),
        answeredUsers: []
      },
    });

    await post.save();
    await post.populate("author", "name studentId year branch avatar");

    const processedPost = {
      ...post.toObject(),
      author: post.isAnonymous ? null : post.author,
      upvoteCount: 0,
      downvoteCount: 0
    };

    res.status(201).json({
      message: "Quiz created successfully.",
      post: processedPost,
    });
  } catch (error) {
    console.error(error);

    if (error.name === "ValidationError") {
      const validationErrors = {};
      for (let field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      message: error.message || "Server Error",
    });
  }
});

router.post("/:postId/answer", auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { selectedOption } = req.body;

    const post = await Post.findById(postId);
    if (!post || !post.isQuiz) {
  return res.status(404).json({
    message: "Quiz not found.",
  });
}
    if (post.quiz.answeredUsers.includes(req.userId)) {
  return res.status(400).json({
    message: "You have already answered this quiz.",
  });
}

    if (!post || !post.isQuiz) {
      return res.status(404).json({
        message: "Quiz not found.",
      });
    }
    const correct = selectedOption === post.quiz.correctAnswer;

post.quiz.answeredUsers.push(req.userId);

await post.save();

res.json({
  correct,
  correctAnswer: post.quiz.correctAnswer,
});

    // res.json({
    //   message: "Answer submitted successfully.",
    //   correct: selectedOption === post.quiz.correctAnswer,
    // });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
});

export default router;