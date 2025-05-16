const mongoose = require('mongoose');
const sanitizeHtml = require('sanitize-html');

const PageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Page name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Page name cannot exceed 100 characters'],
    minlength: [3, 'Page name must be at least 3 characters long']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  body: {
    type: String,
    required: [true, 'Content body is required'],
    set: (value) => sanitizeHtml(value, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'img']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        a: ['href', 'name', 'target', 'rel'],
        img: ['src', 'alt', 'width', 'height']
      },
      allowedSchemes: ['http', 'https', 'data'],
      allowedSchemesByTag: {
        img: ['data']
      }
    })
  },
  seoKeywords: {
    type: [String],
    default: []
  },
  seoDescription: {
    type: String,
    maxlength: [160, 'SEO description cannot exceed 160 characters']
  },
  // Adding a lowercase version of name for faster case-insensitive search
  nameLower: {
    type: String,
    required: true,
    index: true
  },
  // Adding a lowercase version of title for faster case-insensitive search
  titleLower: {
    type: String,
    required: true,
    index: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save hook to maintain lowercase fields
PageSchema.pre('save', function(next) {
  this.nameLower = this.name.toLowerCase();
  this.titleLower = this.title.toLowerCase();
  next();
});

// Pre-update hook to maintain lowercase fields
PageSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.name) {
    update.nameLower = update.name.toLowerCase();
  }
  if (update.title) {
    update.titleLower = update.title.toLowerCase();
  }
  next();
});

// Indexes optimized for live search
PageSchema.index({ nameLower: 1 });
PageSchema.index({ titleLower: 1 });

// Virtual for last updated (human readable)
PageSchema.virtual('lastUpdated').get(function() {
  const now = new Date();
  const diff = now - this.updatedAt;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days/7)} weeks ago`;
  return `${Math.floor(days/30)} months ago`;
});

// Static method for live search
PageSchema.statics.liveSearch = async function(query, limit = 10) {
  const searchTerm = query.toLowerCase();
  return this.find({
    $or: [
      { nameLower: { $regex: `^${searchTerm}`, $options: 'i' } },
      { titleLower: { $regex: `^${searchTerm}`, $options: 'i' } }
    ]
  })
  .limit(limit)
  .select('name title') // Only return what's needed for search results
  .lean();
};

module.exports = mongoose.model('Page', PageSchema);