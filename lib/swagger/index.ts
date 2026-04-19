// lib/swagger/index.ts
import { OpenAPIV3 } from "openapi-types";
import { allPaths, allSchemas, allTags } from "./specs";
import { commonResponses } from "./schemas";

/**
 * Get the complete OpenAPI specification
 * Returns a fully formed OpenAPI 3.0 document
 */
// lib/swagger/index.ts
export function getOpenApiSpec(): OpenAPIV3.Document {
	return {
		openapi: "3.0.0",
		info: {
			title: "API Documentation",
			version: "1.0.0",
			description: "Complete API documentation with all available endpoints",
			contact: {
				name: "API Support",
				email: "support@example.com",
			},
		},
		servers: [
			{
				url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
				description: "API Server",
			},
		],
		tags: allTags,
		paths: allPaths,
		components: {
			schemas: allSchemas,
			securitySchemes: {
				accessToken: {
					type: "apiKey",
					in: "cookie",      // ✅ Keep as cookie
					name: "accessToken",
					description: "Enter the JWT access token value (from login response or browser cookies)",
				},
				refreshToken: {
					type: "apiKey",
					in: "cookie",      // ✅ Keep as cookie
					name: "refreshToken",
					description: "Enter the JWT refresh token value",
				},
			},
			responses: commonResponses,
		},
		security: [
			{
				accessToken: [],
				refreshToken: [],
			},
		],
	};
}

export function getOpenApiStats() {
	const spec = getOpenApiSpec();

	const pathCount = Object.keys(spec.paths || {}).length;
	const schemaCount = spec.components?.schemas
		? Object.keys(spec.components.schemas).length
		: 0;
	const tagCount = spec.tags?.length || 0;

	let totalEndpoints = 0;
	Object.values(spec.paths || {}).forEach((pathItem) => {
		if (pathItem) {
			totalEndpoints += Object.keys(pathItem).filter((key) =>
				["get", "post", "put", "patch", "delete"].includes(key),
			).length;
		}
	});
	console.log(spec,'CONSOLING HHHHH')

	return {
		totalPaths: pathCount,
		totalEndpoints,
		totalSchemas: schemaCount,
		totalTags: tagCount,
		version: spec.info.version,
		title: spec.info.title,
	};
}
