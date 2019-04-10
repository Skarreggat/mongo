var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var FormatoSchema = new Schema({
    name: {type: String, required: true, min: 3, max: 100}
});

// Virtual for this genre instance URL.
FormatoSchema
.virtual('url')
.get(function () {
  return '/catalog/formato/'+this._id;
});

// Export model.
module.exports = mongoose.model('Formato', FormatoSchema);
