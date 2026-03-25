const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username:    { type:String, required:true, trim:true, minlength:2, maxlength:30 },
  email:       { type:String, sparse:true, lowercase:true, trim:true, default:undefined },
  phone:       { type:String, sparse:true, default:undefined },
  password:    { type:String, select:false },
  firebaseUID: { type:String, sparse:true, default:undefined },
  authMethod:  { type:String, enum:["email","phone","google"], default:"email" },
  isVerified:  { type:Boolean, default:false },
  avatar:      { type:String, default:null },
  bio:         { type:String, maxlength:150, default:"" },
  isOnline:    { type:Boolean, default:false },
  lastSeen:    { type:Date, default:Date.now },
}, { timestamps:true });

userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
