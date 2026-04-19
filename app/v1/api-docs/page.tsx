// app/docs/page.tsx
"use client";

import { useEffect } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function ApiDocs() {
	useEffect(() => {
		document.title = "API Documentation";
	}, []);

	return (
		<div className="swagger-wrapper h-screen overflow-auto bg-white">
			<SwaggerUI
				url="/api/open-api"
				docExpansion="list"
				defaultModelsExpandDepth={-1}
				filter={true}
				tryItOutEnabled={true}
				persistAuthorization={true}
				displayRequestDuration={true}
				withCredentials={true}
				defaultModelExpandDepth={-1}
				requestInterceptor={(req) => {
					// ✅ Force cookies from Swagger UI's authorization
					console.log("Cookie header present:", req.headers.Cookie);
					if (req.headers?.Cookie) {
						// Cookies are already set in headers
					}
					
					// ✅ Ensure credentials are included
					req.credentials = "include";
					
					return req;
				}}
			/>
		</div>
	);
}