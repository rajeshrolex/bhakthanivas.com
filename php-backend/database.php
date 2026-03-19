<?php
/**
 * database.php – Singleton PDO Database class
 *
 * Usage:
 *   $db = Database::getInstance();
 *   $rows = $db->fetchAll("SELECT * FROM lodges WHERE id = ?", [$id]);
 *   $row  = $db->fetchOne("SELECT * FROM users WHERE email = ?", [$email]);
 *   $db->query("INSERT INTO users (name) VALUES (?)", ['Alice']);
 *   $lastId = $db->lastInsertId();
 */

declare(strict_types=1);

class Database
{
    private static ?Database $instance = null;
    private PDO $pdo;

    private function __construct()
    {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            DB_HOST,
            DB_PORT,
            DB_NAME
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_PERSISTENT         => true,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
        ];

        try {
            $this->pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'error'   => 'Database connection failed',
                'message' => $e->getMessage(), // Temporarily show full error
            ]);
            exit;
        }
    }

    // Prevent cloning
    private function __clone() {}

    /** @return Database */
    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Execute a prepared statement (INSERT, UPDATE, DELETE).
     * Returns the PDOStatement on success.
     */
    public function query(string $sql, array $params = []): \PDOStatement
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    /**
     * Fetch all rows matching the query.
     * @return array<int, array<string, mixed>>
     */
    public function fetchAll(string $sql, array $params = []): array
    {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }

    /**
     * Fetch a single row (first match).
     * @return array<string, mixed>|null
     */
    public function fetchOne(string $sql, array $params = []): ?array
    {
        $stmt = $this->query($sql, $params);
        $row  = $stmt->fetch();
        return $row !== false ? $row : null;
    }

    /**
     * Return the last inserted auto-increment ID.
     */
    public function lastInsertId(): string
    {
        return $this->pdo->lastInsertId();
    }

    /**
     * Return the underlying PDO instance (for transactions etc.).
     */
    public function getPdo(): PDO
    {
        return $this->pdo;
    }

    /** Begin a transaction */
    public function beginTransaction(): bool
    {
        return $this->pdo->beginTransaction();
    }

    /** Commit a transaction */
    public function commit(): bool
    {
        return $this->pdo->commit();
    }

    /** Rollback a transaction */
    public function rollback(): bool
    {
        return $this->pdo->rollBack();
    }
}
