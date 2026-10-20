CREATE TABLE "accounts_payable" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" uuid,
	"beneficiary_name" varchar(255) NOT NULL,
	"work_order_id" uuid,
	"category" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"paid_amount_cents" integer DEFAULT 0 NOT NULL,
	"balance_cents" integer NOT NULL,
	"due_date" timestamp NOT NULL,
	"status" varchar(30) DEFAULT 'pendente' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts_receivable" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"quote_id" uuid,
	"work_order_id" uuid,
	"description" text NOT NULL,
	"installment_number" integer DEFAULT 1 NOT NULL,
	"total_installments" integer DEFAULT 1 NOT NULL,
	"amount_cents" integer NOT NULL,
	"paid_amount_cents" integer DEFAULT 0 NOT NULL,
	"balance_cents" integer NOT NULL,
	"due_date" timestamp NOT NULL,
	"status" varchar(30) DEFAULT 'pendente' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auxiliary_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"unit" varchar(30) NOT NULL,
	"cost_price_cents" integer NOT NULL,
	"default_price_cents" integer NOT NULL,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"trade_name" varchar(255),
	"document" varchar(30),
	"person_type" varchar(10) DEFAULT 'PJ' NOT NULL,
	"phone" varchar(50),
	"whatsapp" varchar(50),
	"email" varchar(255),
	"address" text,
	"city" varchar(100),
	"state" varchar(10),
	"contact_person" varchar(255),
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" varchar(255) DEFAULT 'GM Sign Solutions' NOT NULL,
	"trade_name" varchar(255) DEFAULT 'GM Sign',
	"cnpj" varchar(30),
	"phone" varchar(50),
	"email" varchar(255),
	"address" text,
	"default_quote_validity_days" integer DEFAULT 10 NOT NULL,
	"default_payment_terms" text DEFAULT '50% de entrada e o restante na entrega.',
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"unit" varchar(30) NOT NULL,
	"cost_price_cents" integer NOT NULL,
	"supplier_id" uuid,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments_received" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receivable_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"commercial_unit" varchar(30) DEFAULT 'm2' NOT NULL,
	"description" text,
	"default_markup_percent" numeric(5, 2) DEFAULT '50.00' NOT NULL,
	"default_loss_percent" numeric(5, 2) DEFAULT '10.00' NOT NULL,
	"default_components" jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"description" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"width_meters" numeric(8, 3),
	"height_meters" numeric(8, 3),
	"unit_area" numeric(8, 3),
	"total_area" numeric(8, 3),
	"pricing_method" varchar(50) DEFAULT 'composicao' NOT NULL,
	"cost_snapshot" jsonb,
	"unit_cost_cents" integer DEFAULT 0 NOT NULL,
	"total_cost_cents" integer DEFAULT 0 NOT NULL,
	"unit_price_cents" integer DEFAULT 0 NOT NULL,
	"total_price_cents" integer DEFAULT 0 NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"client_id" uuid NOT NULL,
	"user_id" uuid,
	"status" varchar(50) DEFAULT 'rascunho' NOT NULL,
	"issue_date" timestamp DEFAULT now() NOT NULL,
	"valid_until" timestamp NOT NULL,
	"payment_conditions" text,
	"delivery_time_days" integer DEFAULT 15,
	"commercial_notes" text,
	"internal_notes" text,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"estimated_cost_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"trade_name" varchar(255),
	"document" varchar(30),
	"phone" varchar(50),
	"email" varchar(255),
	"address" text,
	"contact_person" varchar(255),
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(50) DEFAULT 'admin' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "work_order_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" uuid NOT NULL,
	"previous_status" varchar(50),
	"new_status" varchar(50) NOT NULL,
	"notes" text,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"quote_id" uuid,
	"client_id" uuid NOT NULL,
	"assigned_user_id" uuid,
	"status" varchar(50) DEFAULT 'aguardando_inicio' NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"installation_address" text,
	"expected_start_date" timestamp,
	"expected_delivery_date" timestamp,
	"completed_at" timestamp,
	"production_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "work_orders_code_unique" UNIQUE("code"),
	CONSTRAINT "work_orders_quote_id_unique" UNIQUE("quote_id")
);
--> statement-breakpoint
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments_received" ADD CONSTRAINT "payments_received_receivable_id_accounts_receivable_id_fk" FOREIGN KEY ("receivable_id") REFERENCES "public"."accounts_receivable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_history" ADD CONSTRAINT "work_order_history_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_history" ADD CONSTRAINT "work_order_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;