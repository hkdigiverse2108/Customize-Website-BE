import { Schema, model } from "mongoose";
import { ITheme } from "../../type";

const themeSchema = new Schema<ITheme>(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true, required: true },

    isGlobal: { type: Boolean, default: true }, // Admin theme
    storeId: { type: Schema.Types.ObjectId, ref: "store", default: null },

    // 🎨 Global Styling
    styles: {
      colors: {
        primary: String,
        secondary: String,
        background: String,
        text: String,
      },
      fonts: {
        heading: String,
        body: String,
      },
      layout: {
        containerWidth: { type: String, enum: ["full", "boxed"], default: "full" },
        spacing: String,
      },
    },

    // 🧠 Page Structure
    layoutJSON: {
      home: [{
        componentId: { type: String, required: true },
        order: { type: Number, required: true },
        config: { type: Object, default: {} }
      }],
      product: [{
        componentId: { type: String, required: true },
        order: { type: Number, required: true },
        config: { type: Object, default: {} }
      }],
      cart: [{
        componentId: { type: String, required: true },
        order: { type: Number, required: true },
        config: { type: Object, default: {} }
      }],
      collection: [{
        componentId: { type: String, required: true },
        order: { type: Number, required: true },
        config: { type: Object, default: {} }
      }],
    },

    // 📦 Metadata
    previewImage: String,
    category: String, // fashion, electronics
    tags: [String],

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

// Partial index for soft deletes
themeSchema.index({ slug: 1, isDeleted: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
themeSchema.index({ storeId: 1, isDeleted: 1 });

export const themeModel = model<ITheme>("theme", themeSchema);
