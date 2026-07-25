import React, {useState} from 'react';
import api from "../services/axiosSetup";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Image, X } from "lucide-react";

const Qna = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const addOption = () => {
  if (options.length < 8) {
    setOptions([...options, '']);
  }
};
  const [loading, setLoading] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [tags, setTags] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (question.trim() === "") {
    alert("Please enter a question.");
    return;
  }


  const filledOptions = options.filter(
    (option) => option.trim() !== ""
  );

  if (filledOptions.length < 2) {
    alert("Please enter at least 2 options.");
    return;
  }

  if (correctAnswer === null) {
  alert("Please select the correct answer.");
  return;
}

  setLoading(true);

try {
  const formDataToSend = new FormData();
  formDataToSend.append("question", question);
  filledOptions.forEach((option) => {
    formDataToSend.append("options", option);
  });
  formDataToSend.append("correctAnswer", correctAnswer);
  formDataToSend.append("tags", tags);
  formDataToSend.append("isAnonymous", isAnonymous);

  imageFiles.forEach((file) => {
    formDataToSend.append("images", file);
  });

  await api.post("/api/quiz", formDataToSend);

  toast.success("Question submitted successfully!");
  

  setQuestion("");
  setOptions(["", ""]);
  setCorrectAnswer(null);
  setTags("");
  setIsAnonymous(false);

  navigate("/");

} catch (error) {
  toast.error("Failed to submit question.");
  console.error(error);
} finally {
  setLoading(false);
}
  
};

const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedImages.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const newImageFiles = files.filter(file => {
      // Check Size (Max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 5MB.`);
        return false;
      }
      // Check Type (PNG or JPG/JPEG only)
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        toast.error(`"${file.name}" is ignored. Only PNG and JPG images are allowed.`);
        return false;
      }
      return true;
    });

    const newImagePreviews = newImageFiles.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name
    }));

    setSelectedImages([...selectedImages, ...newImagePreviews]);
    setImageFiles([...imageFiles, ...newImageFiles]);
  };
  const removeImage = (index) => {
    const newSelectedImages = [...selectedImages];
    const newImageFiles = [...imageFiles];

    // Revoke the object URL to free up memory
    URL.revokeObjectURL(selectedImages[index].url);

    newSelectedImages.splice(index, 1);
    newImageFiles.splice(index, 1);

    setSelectedImages(newSelectedImages);
    setImageFiles(newImageFiles);
  };

  return (
    <form onSubmit={handleSubmit}>
    <div className="relative z-10 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-4 sm:p-10 rounded-3xl shadow-2xl backdrop-blur-xl border border-white/5">
        <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4">
              Ask a Question
            </h1>

             {/* <div>
  <label>Question</label>

  <input
    type="text"
    value={question}
    onChange={(e) => setQuestion(e.target.value)}
    placeholder="Enter your question"
  />
</div> */}
{/* {options.map((option, index) => (
  <div key={index}>
    <input
      type="text"
      value={option}
      onChange={(e) => {
        const newOptions = [...options];
        newOptions[index] = e.target.value;
        setOptions(newOptions);
      }}
      placeholder={`Option ${index + 1}`}
    />
  </div>
))}
<button
  type="button"
  onClick={addOption}
>
  + Add Option
</button>
<div>
  <label>Correct Answer</label> */}

  {/* <select
    value={correctAnswer ?? ""}
    onChange={(e) => setCorrectAnswer(Number(e.target.value))}
  >
    <option value="">Select Correct Answer</option>

    {options.map((_, index) => (
      <option key={index} value={index}>
        Option {index + 1}
      </option>
    ))}
  </select>
</div>
<div> */}
  {/* <label>Tags</label>

  <input
    type="text"
    value={tags}
    onChange={(e) => setTags(e.target.value)}
    placeholder="react, javascript, quiz"
  />
</div>
<div>
  <label>
    <input
      type="checkbox"
      checked={isAnonymous}
      onChange={(e) => setIsAnonymous(e.target.checked)}
    /> */}

    {/* Post Anonymously
  </label>
</div> */}


             <p className="text-gray-400 text-lg">
              Ask the K-Forum community and let everyone test their knowledge.
            </p> 
          </div>
        <div className="space-y-2">
  <label className="text-sm font-bold text-gray-300 uppercase tracking-wider ml-1">
    Question
  </label>

  <input
    type="text"
    value={question}
    onChange={(e) => setQuestion(e.target.value)}
    placeholder="Ask your question..."
    className="w-full bg-white/5 text-white px-6 py-4 rounded-2xl border border-gray-700/50 focus:border-emerald-500/50 focus:bg-white/10 focus:outline-none transition-all"
  />
</div>


          <div className="space-y-4 mt-8">

  <label className="text-sm font-bold text-gray-300 uppercase tracking-wider ml-1">
    Options
  </label>

  {options.map((option, index) => (
  <div key={index} className="flex items-center gap-4">

    <input
      type="radio"
      name="correctAnswer"
      checked={correctAnswer === index}
      onChange={() => setCorrectAnswer(index)}
    />

    <input
      type="text"
      value={option}
      onChange={(e) => {
        const newOptions = [...options];
        newOptions[index] = e.target.value;
        setOptions(newOptions);
      }}
      placeholder={`Option ${index + 1}`}
      className="w-full bg-white/5 text-white px-6 py-4 rounded-2xl border border-gray-700/50 focus:border-emerald-500/50 focus:bg-white/10 focus:outline-none transition-all"
    />

  </div>
))}
  {options.length < 8 && (
  <button
    type="button"
    onClick={addOption}
    className="w-full mt-4 border border-emerald-500 text-emerald-400 py-3 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all"
  >
    + Add Option
  </button>
)}
 {/* Image Upload */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-300 uppercase tracking-wider ml-1">
                Images (Max 5)
              </label>
              <div className="space-y-4">
                <label className="w-full flex flex-col items-center justify-center px-4 py-8 bg-white/5 text-gray-400 rounded-2xl border-2 border-white/10 border-dashed cursor-pointer hover:border-emerald-500/50 hover:bg-white/10 transition-all group">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <Image className="w-8 h-8 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <span className="text-sm font-medium group-hover:text-emerald-300 transition-colors">Click to upload images</span>
                  <span className="text-xs text-gray-600 mt-1">JPG, PNG up to 5MB each</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                {selectedImages.length > 0 && (
                  <div className={`${selectedImages.length === 1 ? '' : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'}`}>
                    {selectedImages.map((image, index) => (
                      <div key={index} className={`relative group overflow-hidden glass-card rounded-2xl ${selectedImages.length === 1
                          ? 'w-full max-w-2xl mx-auto'
                          : 'aspect-square'
                        }`}>
                        <img
                          src={image.url}
                          alt={`Preview ${index + 1}`}
                          className={`w-full object-cover ${selectedImages.length === 1
                              ? 'h-auto max-h-[500px] object-contain bg-black/5'
                              : 'h-full'
                            }`}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full transform scale-0 group-hover:scale-100 transition-all"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
{/* Tags */}
<div className="space-y-2 mt-6">
  <label className="text-sm font-bold text-gray-300 uppercase tracking-wider ml-1">
    Tags (Optional)
  </label>

  <input
    type="text"
    value={tags}
    onChange={(e) => setTags(e.target.value)}
    placeholder="react, javascript, dsa"
    className="w-full bg-white/5 text-white px-6 py-4 rounded-2xl border border-gray-700/50 focus:border-emerald-500/50 focus:bg-white/10 focus:outline-none transition-all"
  />
</div>

{/* Public / Anonymous Toggle */}
<div
  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
    isAnonymous
      ? "bg-emerald-900/10 border-emerald-500/30"
      : "bg-white/5 border-white/5"
  }`}
>
  <div>
    <h3 className="font-bold text-white">
      {isAnonymous ? "Anonymous Question" : "Public Question"}
    </h3>

    <p className="text-sm text-gray-400">
      {isAnonymous
        ? "Your identity will be hidden."
        : "Your name will be visible."}
    </p>
  </div>

  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      checked={isAnonymous}
      onChange={(e) => setIsAnonymous(e.target.checked)}
      className="sr-only peer"
    />

    <div className="w-14 h-8 bg-gray-700 rounded-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-6"></div>
  </label>
</div>

  <button
    onClick={handleSubmit}
    className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl transition-all"
>
  Submit Question
</button>
</div>

        </div>
      </div>
    </div>
    {/* <button
  type="submit"
  disabled={loading}
>
  {loading ? "Posting..." : "Post Quiz"}
</button> */}
    </form>
  );
};

export default Qna;