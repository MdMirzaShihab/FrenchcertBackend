const ServiceCategory = require('../models/ServiceCategory');

// Create a new service category
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = new ServiceCategory({ name });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all service categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await ServiceCategory.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a service category
exports.updateCategory = async (req, res) => {
  try {
    const category = await ServiceCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a service category
exports.deleteCategory = async (req, res) => {
  try {
    await ServiceCategory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
