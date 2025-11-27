# Tarefas do Projeto - File Processing Pipeline

## 4. LAMBDA — ARQUITETURA DE CÓDIGO (Node.js + SOLID)

### 4.1 Implementar FileMetadata Entity
Criar entidade de domínio para representar metadados de arquivo com validações e métodos de conversão.

### 4.2 Implementar ProcessedFile Entity
Criar entidade para representar arquivo processado com status e dados extraídos.

### 4.3 Definir IMetadataRepository
Criar contrato (interface) do repositório de metadados seguindo inversão de dependência.

### 4.4 Definir IFileProcessor
Criar contrato para processadores de arquivos que permite múltiplos formatos.

### 4.5 Definir IFileReader
Criar contrato para leitores de arquivo abstraindo storage (S3 ou outros).

### 4.6 Implementar ExtractMetadataUseCase
Caso de uso para extrair metadados básicos de arquivos (nome, tamanho, MIME type, etc).

### 4.7 Implementar ProcessFileUseCase
Caso de uso principal que orquestra o fluxo completo: extrair metadados → processar arquivo → salvar DynamoDB.

### 4.8 Implementar CSVParser
Parser para processar arquivos CSV extraindo número de linhas, colunas e preview.

### 4.9 Implementar XLSXParser
Parser para processar arquivos Excel extraindo sheets, linhas e preview.

### 4.10 Implementar PDFParser
Parser para extrair metadados básicos de PDFs (páginas, autor, título, data de criação).

### 4.11 Implementar ImageParser
Parser para extrair metadados de imagens (dimensões, formato, EXIF data).

### 4.12 Implementar FileProcessorStrategy
Strategy pattern para selecionar o parser correto baseado no MIME type do arquivo.

### 4.13 Implementar S3FileReader
Adapter concreto para ler arquivos do S3 implementando IFileReader.

### 4.14 Implementar DynamoMetadataRepository
Adapter concreto para salvar metadados no DynamoDB implementando IMetadataRepository.

### 4.15 Implementar S3EventAdapter
Adapter para normalizar e validar eventos S3 recebidos pela Lambda.

### 4.16 Implementar Logger Estruturado
Logger JSON estruturado para CloudWatch facilitando análise e alertas.

### 4.17 Implementar MimeTypeDetector
Utilitário para detectar MIME type real de arquivos baseado no conteúdo.

### 4.18 Implementar ErrorHandler
Centralizador de tratamento de erros com categorização e logs padronizados.

### 4.19 Implementar Container DI
Container de injeção de dependências para instanciar e conectar todos os componentes.

### 4.20 Implementar s3Handler
Handler principal da Lambda que recebe eventos S3 e orquestra o processamento.

### 4.21 Implementar Config Loader
Carregador de configurações de ambiente com validação de variáveis obrigatórias.

---

## 5. PROCESSAMENTO DE ARQUIVOS

### 5.1 Instalar Dependências
Adicionar todas as bibliotecas necessárias para processamento de múltiplos formatos (papaparse, xlsx, pdf-parse, sharp, file-type, pino).

### 5.2 Validar Formatos Suportados
Criar lista de MIME types suportados e validação para rejeitar formatos não suportados.

---

## 6. TESTES E QUALIDADE

### 6.1 Configurar Jest
Setup completo do ambiente de testes com Jest incluindo configuração de coverage.

### 6.2 Testar FileMetadata Entity
Testes unitários da entidade FileMetadata validando regras de negócio.

### 6.3 Testar Use Cases
Testes unitários do ProcessFileUseCase com mocks de todas as dependências.

### 6.4 Testar S3FileReader
Testes unitários do adapter S3 com mock do SDK AWS.

### 6.5 Testar DynamoMetadataRepository
Testes unitários do adapter DynamoDB com mock do SDK AWS.

### 6.6 Teste End-to-End Local
Simular pipeline completa localmente com LocalStack ou ambiente AWS de dev.

### 6.7 Teste API Gateway → S3
Testar upload real de arquivo via API Gateway validando integração completa.

---

## 7. CI/CD

### 7.1 Pipeline Terraform Plan
Criar GitHub Actions workflow para validar mudanças de infraestrutura com `terraform plan`.

### 7.2 Pipeline Terraform Apply
Criar GitHub Actions workflow para deploy automatizado de infraestrutura.

### 7.3 Pipeline CI (Lint + Test)
Criar GitHub Actions workflow para validar código com linting e testes em todos os PRs.

### 7.4 Pipeline Deploy Lambda
Criar GitHub Actions workflow para deploy automatizado da Lambda com Serverless Framework.

---

## 8. SEGURANÇA E BOAS PRÁTICAS

### 8.1 Validar Nenhum Secret Hardcoded
Auditoria de segurança para garantir que não há credenciais ou secrets no código.

### 8.2 Validar Tamanho de Arquivo
Implementar validação de tamanho máximo de arquivo para prevenir DoS e custos excessivos.

### 8.3 Validar MIME Type
Validar MIME type real vs extensão do arquivo para prevenir upload de arquivos maliciosos.

---

## ORDEM RECOMENDADA DE EXECUÇÃO

### Fase 1: Fundação
1. Infraestrutura Terraform (2.1-2.4)
2. Configuração Serverless (3.1-3.5)
3. Domain Layer (4.1-4.5)

### Fase 2: Core Business
4. Application Use Cases (4.6-4.7)
5. Infrastructure Adapters (4.13-4.15, 4.16)
6. Container DI (4.19)
7. Handler Principal (4.20-4.21)

### Fase 3: Processadores
8. Instalar Dependências (5.1)
9. Implementar Parsers (4.8-4.12)
10. Utils (4.17-4.18)
11. Validações (5.2)

### Fase 4: Qualidade
12. Setup Testes (6.1)
13. Testes Unitários (6.2-6.5)
14. Testes Integração (6.6-6.7)

### Fase 5: Automação e Segurança
15. CI/CD Pipelines (7.1-7.4)
16. Segurança e Validações (8.1-8.3)

---

## RESUMO EXECUTIVO

**Total de Tarefas**: 45 tarefas principais  
**Tempo Estimado**: 3-4 semanas (1 dev full-time)  
**Prioridade Crítica**: Tarefas 3.1, 4.1-4.7, 4.13-4.14, 4.19-4.20  
**Prioridade Alta**: Tarefas 2.3, 3.2-3.5, 4.8-4.12, 4.16, 5.1, 6.1-6.5  
**Prioridade Média**: Tarefas 2.1-2.2, 2.4, 4.15, 4.17-4.18, 4.21, 5.2, 6.6-6.7, 7.1-7.4  
**Prioridade Baixa**: Tarefas 8.1-8.3

**Próximos Passos Imediatos**:
1. Corrigir handler.js (3.1)
2. Implementar FileMetadata entity (4.1)
3. Implementar S3FileReader (4.13)
4. Implementar ProcessFileUseCase (4.7)
5. Deploy e testar pipeline básica
