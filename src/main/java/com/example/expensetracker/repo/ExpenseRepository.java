package com.example.expensetracker.repo;

import com.example.expensetracker.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e " +
            "WHERE MONTH(e.date) = :month AND YEAR(e.date) = :year")
    double getMonthlyTotal(int month, int year);
}
