# API Conventions

## RESTful Design
- Use plural nouns for resource names: `/users`, `/orders`
- HTTP verbs:
  - `GET`    – Read resource(s)
  - `POST`   – Create a new resource
  - `PUT`    – Replace a resource entirely
  - `PATCH`  – Partial update
  - `DELETE` – Remove a resource

## URL Structure
- Versioning in path: `/api/v1/resource`
- Nested resources: `/api/v1/users/{id}/orders`

## Request & Response
- Always use JSON (`Content-Type: application/json`)
- Response envelope:
```json
{
  "data": {},
  "error": null,
  "meta": { "page": 1, "total": 100 }
}
```

## Status Codes
- `200` OK, `201` Created, `204` No Content
- `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found
- `422` Validation Error, `500` Internal Server Error

## Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "field": "email"
  }
}
```
