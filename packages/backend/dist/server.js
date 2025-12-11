"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const dotenv_1 = __importDefault(require("dotenv"));
const pino_1 = __importDefault(require("pino"));
dotenv_1.default.config();
const logger = (0, pino_1.default)();
const PORT = process.env.PORT || 3001;
app_1.app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});
