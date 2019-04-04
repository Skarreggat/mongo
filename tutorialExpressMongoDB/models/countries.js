var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CountrySchema = new Schema(
  {
    name: {type: String, required: true, max: 100},
    continent: {type: String},
  }
);

// Virtual for country's URL
CountrySchema
.virtual('url')
.get(function () {
  return '/catalog/country/' + this._id;
});

//Export model
module.exports = mongoose.model('Country', CountrySchema);
