import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema({
  artistName: {
    type: String,
    required: true
  },
  artistId: {
    type: String,
    required: true
  },
  searchedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('SearchHistory', searchHistorySchema); 