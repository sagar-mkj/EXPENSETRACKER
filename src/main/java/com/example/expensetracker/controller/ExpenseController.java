package com.example.expensetracker.controller;

import com.example.expensetracker.Expense;
import com.example.expensetracker.repo.ExpenseRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "*")
public class ExpenseController {

    @Autowired
    private ExpenseRepository expenseRepository;

    private static final double MONTHLY_LIMIT = 20000.0; // set your limit here

    // Get all expenses
    @GetMapping
    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    // Add new expense
    @PostMapping
    public ResponseEntity<String> addExpense(@RequestBody Expense expense) {
        expenseRepository.save(expense);

        // check total for current month
        LocalDate today = LocalDate.now();
        double total = expenseRepository.getMonthlyTotal(today.getMonthValue(), today.getYear());

        if (total > MONTHLY_LIMIT) {
            return ResponseEntity.ok("⚠️ Warning: Monthly spending limit exceeded! Current total: ₹" + total);
        }
        return ResponseEntity.ok("Expense added successfully! Current total: ₹" + total);
    }

    // Get expense by ID
    @GetMapping("/{id}")
    public Expense getExpenseById(@PathVariable Long id) {
        return expenseRepository.findById(id).orElse(null);
    }

    // Update expense
    @PutMapping("/{id}")
    public ResponseEntity<Expense> updateExpense(@PathVariable Long id, @RequestBody Expense expenseDetails) {
        return expenseRepository.findById(id)
                .map(expense -> {
                    expense.setTitle(expenseDetails.getTitle());
                    expense.setCategory(expenseDetails.getCategory());
                    expense.setAmount(expenseDetails.getAmount());
                    expense.setDate(expenseDetails.getDate());
                    Expense updatedExpense = expenseRepository.save(expense);
                    return ResponseEntity.ok(updatedExpense);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete expense
    @DeleteMapping("/{id}")
    public String deleteExpense(@PathVariable Long id) {
        expenseRepository.deleteById(id);
        return "Expense with id " + id + " deleted successfully.";
    }

    @GetMapping("/csrf-token")
    public CsrfToken getCsrftoken(HttpServletRequest request){
        return (CsrfToken) request.getAttribute("_csrf");




    }
}
