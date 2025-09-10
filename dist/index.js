var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/env-loader.ts
import * as dotenv from "dotenv";
dotenv.config();

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  chatMessages: () => chatMessages,
  complianceItems: () => complianceItems,
  dormantAccounts: () => dormantAccounts,
  insertChatMessageSchema: () => insertChatMessageSchema,
  insertComplianceItemSchema: () => insertComplianceItemSchema,
  insertDormantAccountSchema: () => insertDormantAccountSchema,
  insertSqlQuerySchema: () => insertSqlQuerySchema,
  insertUserSchema: () => insertUserSchema,
  sqlQueries: () => sqlQueries,
  users: () => users
});
import { pgTable, text, serial, integer, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow()
});
var dormantAccounts = pgTable("dormant_accounts", {
  id: serial("id").primaryKey(),
  accountId: text("account_id").notNull().unique(),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull(),
  lastActivity: timestamp("last_activity").notNull(),
  customerName: text("customer_name").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow()
});
var complianceItems = pgTable("compliance_items", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("pending"),
  priority: text("priority").notNull().default("medium"),
  createdAt: timestamp("created_at").defaultNow()
});
var chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(),
  // 'user' or 'bot'
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var sqlQueries = pgTable("sql_queries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  naturalLanguage: text("natural_language").notNull(),
  generatedSQL: text("generated_sql").notNull(),
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true
});
var insertDormantAccountSchema = createInsertSchema(dormantAccounts).pick({
  accountId: true,
  balance: true,
  lastActivity: true,
  customerName: true,
  category: true,
  status: true
});
var insertComplianceItemSchema = createInsertSchema(complianceItems).pick({
  type: true,
  description: true,
  dueDate: true,
  status: true,
  priority: true
});
var insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  type: true,
  message: true
});
var insertSqlQuerySchema = createInsertSchema(sqlQueries).pick({
  userId: true,
  naturalLanguage: true,
  generatedSQL: true,
  executedAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getDormantAccounts() {
    return await db.select().from(dormantAccounts);
  }
  async getDormantAccount(id) {
    const [account] = await db.select().from(dormantAccounts).where(eq(dormantAccounts.id, id));
    return account || void 0;
  }
  async createDormantAccount(insertAccount) {
    const [account] = await db.insert(dormantAccounts).values(insertAccount).returning();
    return account;
  }
  async updateDormantAccountStatus(id, status) {
    const [account] = await db.update(dormantAccounts).set({ status }).where(eq(dormantAccounts.id, id)).returning();
    return account || void 0;
  }
  async getComplianceItems() {
    return await db.select().from(complianceItems);
  }
  async getComplianceItem(id) {
    const [item] = await db.select().from(complianceItems).where(eq(complianceItems.id, id));
    return item || void 0;
  }
  async createComplianceItem(insertItem) {
    const [item] = await db.insert(complianceItems).values(insertItem).returning();
    return item;
  }
  async updateComplianceItemStatus(id, status) {
    const [item] = await db.update(complianceItems).set({ status }).where(eq(complianceItems.id, id)).returning();
    return item || void 0;
  }
  async getChatMessages(userId) {
    return await db.select().from(chatMessages).where(eq(chatMessages.userId, userId));
  }
  async createChatMessage(insertMessage) {
    const [message] = await db.insert(chatMessages).values(insertMessage).returning();
    return message;
  }
  async getSqlQueries(userId) {
    return await db.select().from(sqlQueries).where(eq(sqlQueries.userId, userId));
  }
  async createSqlQuery(insertQuery) {
    const [query] = await db.insert(sqlQueries).values(insertQuery).returning();
    return query;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
async function registerRoutes(app2) {
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (user && user.password === password) {
        res.json({ success: true, user: { id: user.id, username: user.username } });
      } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        res.status(400).json({ success: false, message: "Username already exists" });
        return;
      }
      const user = await storage.createUser(userData);
      res.json({ success: true, user: { id: user.id, username: user.username } });
    } catch (error) {
      res.status(400).json({ success: false, message: "Invalid user data" });
    }
  });
  app2.get("/api/dormant-accounts", async (req, res) => {
    try {
      const accounts = await storage.getDormantAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dormant accounts" });
    }
  });
  app2.post("/api/dormant-accounts", async (req, res) => {
    try {
      const accountData = insertDormantAccountSchema.parse(req.body);
      const account = await storage.createDormantAccount(accountData);
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: "Invalid account data" });
    }
  });
  app2.patch("/api/dormant-accounts/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const account = await storage.updateDormantAccountStatus(id, status);
      if (account) {
        res.json(account);
      } else {
        res.status(404).json({ message: "Account not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update account status" });
    }
  });
  app2.get("/api/compliance-items", async (req, res) => {
    try {
      const items = await storage.getComplianceItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch compliance items" });
    }
  });
  app2.post("/api/compliance-items", async (req, res) => {
    try {
      const itemData = insertComplianceItemSchema.parse(req.body);
      const item = await storage.createComplianceItem(itemData);
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: "Invalid compliance item data" });
    }
  });
  app2.patch("/api/compliance-items/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const item = await storage.updateComplianceItemStatus(id, status);
      if (item) {
        res.json(item);
      } else {
        res.status(404).json({ message: "Compliance item not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update compliance item status" });
    }
  });
  app2.get("/api/chat-messages/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const messages = await storage.getChatMessages(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });
  app2.post("/api/chat-messages", async (req, res) => {
    try {
      const messageData = insertChatMessageSchema.parse(req.body);
      const message = await storage.createChatMessage(messageData);
      if (messageData.type === "user") {
        const botResponse = await storage.createChatMessage({
          userId: messageData.userId,
          type: "bot",
          message: "I'm processing your request. Here's what I found..."
        });
        res.json([message, botResponse]);
      } else {
        res.json(message);
      }
    } catch (error) {
      res.status(400).json({ message: "Invalid message data" });
    }
  });
  app2.get("/api/sql-queries/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const queries = await storage.getSqlQueries(userId);
      res.json(queries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SQL queries" });
    }
  });
  app2.post("/api/sql-queries/generate", async (req, res) => {
    try {
      const { naturalLanguage, userId } = req.body;
      let generatedSQL = "SELECT * FROM accounts WHERE 1=1";
      if (naturalLanguage.toLowerCase().includes("dormant")) {
        generatedSQL = `SELECT account_id, balance, last_activity_date, customer_name 
FROM dormant_accounts 
WHERE last_activity_date < DATE_SUB(NOW(), INTERVAL 6 MONTH)
ORDER BY balance DESC`;
      }
      if (naturalLanguage.toLowerCase().includes("high value") || naturalLanguage.toLowerCase().includes("50k")) {
        generatedSQL += " AND balance >= 50000";
      }
      const queryData = insertSqlQuerySchema.parse({
        userId,
        naturalLanguage,
        generatedSQL
      });
      const query = await storage.createSqlQuery(queryData);
      res.json(query);
    } catch (error) {
      res.status(400).json({ message: "Failed to generate SQL" });
    }
  });
  app2.post("/api/sql-queries/execute", async (req, res) => {
    try {
      const { sqlQuery } = req.body;
      const mockResults = [
        { account_id: "ACC-001", balance: 125500, last_activity_date: "2024-03-15", customer_name: "John Doe" },
        { account_id: "ACC-002", balance: 98750, last_activity_date: "2024-02-28", customer_name: "Jane Smith" },
        { account_id: "ACC-003", balance: 87300, last_activity_date: "2024-04-10", customer_name: "Bob Johnson" }
      ];
      res.json({ results: mockResults, rowCount: mockResults.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to execute SQL query" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen(port, () => {
    log(`Serving on port ${port}`);
  });
})();
