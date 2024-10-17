import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Button, Dimensions} from 'react-native';
import {LineChart, BarChart} from 'react-native-chart-kit';
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {env} from "../../../env";
import {getDatesInRange} from "../../utils/dateRange.tsx";
import {formatCurrency} from "../../utils/formatCurrency.tsx";

interface Transaction {
    cash_book_data: {
        transaction_type: string;
        transaction_amount: number;
        transaction_time: string;
    }[];
}

const OwnerDashboard = () => {
    const screenWidth = Dimensions.get('window').width;
    const [overallData, setOverallData] = useState({income: 0, expense: 0, profit: 0});
    const [earliestDate, setEarliestDate] = useState<Date | null>(null);
    const [dailyData, setDailyData] = useState<{ income: number[], expense: number[], profit: number[] }>({
        income: [],
        expense: [],
        profit: []
    });
    const [dateRange, setDateRange] = useState<string[]>([]);
    const [barChartPage, setBarChartPage] = useState(0);
    const [lineChartPage, setLineChartPage] = useState(0);
    const pageSize = 7

    useEffect(() => {
        const fetchTransactionData = async () => {
            try {
                const token = await AsyncStorage.getItem('access_token');
                const response = await axios.get(`${env}transaction/owner-accounts`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                });

                if (response.status === 200) {
                    const transactions: Transaction[] = response.data;
                    if (transactions.length === 0) {
                        console.log("No transactions available.");
                        return;
                    }

                    const parseDate = (dateString: string) => new Date(dateString);
                    const allTransactionDates = transactions.flatMap(transaction =>
                        transaction.cash_book_data.map(t => parseDate(t.transaction_time))
                    );

                    const earliestDateValue = new Date(Math.min(...allTransactionDates.map(date => date.getTime())));
                    setEarliestDate(earliestDateValue);
                    const latestDate = new Date(Math.max(...allTransactionDates.map(date => date.getTime())));
                    const totalDays = Math.ceil((latestDate.getTime() - earliestDateValue.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    let dailyIncome: number[] = Array(totalDays).fill(0);
                    let dailyExpense: number[] = Array(totalDays).fill(0);

                    allTransactionDates.forEach((date, index) => {
                        const dayIndex = Math.floor((date.getTime() - earliestDateValue.getTime()) / (1000 * 60 * 60 * 24));
                        const transaction = transactions.flatMap(t => t.cash_book_data)[index];
                        if (transaction.transaction_type === 'income') {
                            dailyIncome[dayIndex] += transaction.transaction_amount;
                        } else if (transaction.transaction_type === 'expense') {
                            dailyExpense[dayIndex] += transaction.transaction_amount;
                        }
                    });
                    const dailyProfit = dailyIncome.map((income, index) => income - dailyExpense[index]);

                    setDailyData({
                        income: dailyIncome,
                        expense: dailyExpense,
                        profit: dailyProfit,
                    });

                    const totalIncome = dailyIncome.reduce((acc, curr) => acc + curr, 0);
                    const totalExpense = dailyExpense.reduce((acc, curr) => acc + curr, 0);
                    const totalProfit = dailyProfit.reduce((acc, curr) => acc + curr, 0);

                    setOverallData({
                        income: totalIncome,
                        expense: totalExpense,
                        profit: totalProfit,
                    });
                } else {
                    console.error("Failed to fetch transactions:", response);
                }
            } catch (error) {
                console.error("An error occurred while fetching transaction data:", error);
            }
        };

        fetchTransactionData();
    }, []);

    useEffect(() => {
        if (earliestDate) {
            const now = new Date();
            const dateRange = getDatesInRange(earliestDate, now).reverse();
            setDateRange(dateRange);
            setBarChartPage(0);
            setLineChartPage(0);
        }
    }, [earliestDate]);
    console.log("date range", dateRange)

    const totalPages = Math.ceil(dateRange.length / pageSize)
    const handleBarChartNextPage = () => {
        if (barChartPage < totalPages - 1) {
            setBarChartPage(barChartPage + 1);
        }
    };

    const handleBarChartPreviousPage = () => {
        if (barChartPage > 0) {
            setBarChartPage(barChartPage - 1);
        }
    };

    const handleLineChartNextPage = () => {
        if (lineChartPage < totalPages - 1) {
            setLineChartPage(lineChartPage + 1);
        }
    };

    const handleLineChartPreviousPage = () => {
        if (lineChartPage > 0) {
            setLineChartPage(lineChartPage - 1);
        }
    };

    const reversedIncome = dailyData.income.reverse();
    const reversedExpense = dailyData.expense.reverse();
    const reversedProfit = dailyData.profit.reverse();

    const slicedBarChartLabels = dateRange.slice(barChartPage * pageSize, (barChartPage + 1) * pageSize);
    const slicedBarChartProfit = reversedProfit.slice(barChartPage * pageSize, (barChartPage + 1) * pageSize);

    const slicedLineChartLabels = dateRange.slice(lineChartPage * pageSize, (lineChartPage + 1) * pageSize);
    const slicedLineChartIncome = reversedIncome.slice(lineChartPage * pageSize, (lineChartPage + 1) * pageSize);
    const slicedLineChartExpense = reversedExpense.slice(lineChartPage * pageSize, (lineChartPage + 1) * pageSize);
    const slicedLineChartProfit = reversedProfit.slice(lineChartPage * pageSize, (lineChartPage + 1) * pageSize);

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.topText}>Home</Text>
            </View>
            <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Incomes</Text>
                <Text style={styles.infoCardValue}>{`Rs. ${formatCurrency(overallData.income)}`}</Text>
            </View>
            <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Expenses</Text>
                <Text style={styles.infoCardValue}>{`Rs. ${formatCurrency(overallData.expense)}`}</Text>
            </View>
            <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Profit</Text>
                <Text style={styles.infoCardValue}>{`Rs. ${formatCurrency(overallData.profit)}`}</Text>
            </View>
            <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Today Sales</Text>
                <Text style={styles.infoCardValue}>Rs. 12,000.00</Text>
            </View>
            <Text style={styles.chartTitle}>Daily Sales</Text>
            <BarChart
                data={{
                    labels: slicedBarChartLabels,
                    datasets: [{data: slicedBarChartProfit}],
                }}
                width={screenWidth - 40}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={chartConfig}
                style={styles.chart}
            />
            <View style={styles.paginationButtons}>
                <Button title="Previous" onPress={handleBarChartPreviousPage} disabled={barChartPage === 0}/>
                <Text>{`${barChartPage + 1} / ${totalPages}`}</Text>
                <Button title="Next" onPress={handleBarChartNextPage} disabled={barChartPage === totalPages - 1}/>
            </View>

            <Text style={styles.chartTitle}>Financial Metrics</Text>
            {dailyData.income.length > 0 && <LineChart
                data={{
                    labels: slicedLineChartLabels,
                    datasets: [
                        {data: slicedLineChartIncome, color: () => 'blue', strokeWidth: 2},
                        {data: slicedLineChartExpense, color: () => 'red', strokeWidth: 2},
                        {data: slicedLineChartProfit, color: () => 'green', strokeWidth: 2},
                    ],
                }}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
            />}
            <View style={styles.paginationButtons}>
                <Button title="Previous" onPress={handleLineChartPreviousPage} disabled={lineChartPage === 0}/>
                <Text>{`${lineChartPage + 1} / ${totalPages}`}</Text>
                <Button title="Next" onPress={handleLineChartNextPage} disabled={lineChartPage === totalPages - 1}/>
            </View>
        </ScrollView>
    );
};

const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 139, ${opacity})`,
    style: {
        borderRadius: 16,
    },
    propsForDots: {
        r: '6',
        strokeWidth: '2',
        stroke: '#000000',
    },
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    topText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    infoCard: {
        backgroundColor: '#cce5ff',
        padding: 20,
        borderRadius: 8,
        marginBottom: 15,
    },
    infoCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    infoCardValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 10,
        textAlign: 'center',
        color: '#000000'
    },
    chart: {
        marginVertical: 10,
        borderRadius: 16,
    },
    paginationButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
});

export default OwnerDashboard;