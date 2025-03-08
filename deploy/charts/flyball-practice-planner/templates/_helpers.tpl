{{- define "flyball.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.Version }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "flyball.api.labels" -}}
{{ include "flyball.labels" . }}
app.kubernetes.io/component: api
{{- end }}

{{- define "flyball.frontend.labels" -}}
{{ include "flyball.labels" . }}
app.kubernetes.io/component: frontend
{{- end }}

{{- define "flyball.fullname" -}}
{{ .Release.Name }}-{{ .Chart.Name }}
{{- end }}
