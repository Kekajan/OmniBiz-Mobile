import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Button, Dimensions, TouchableOpacity} from 'react-native';
import {LineChart, BarChart} from 'react-native-chart-kit';
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {env} from "../../../env";
import {getDatesInRange} from "../../utils/dateRange.tsx";
import {formatCurrency} from "../../utils/formatCurrency.tsx";
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {faRightFromBracket} from '@fortawesome/free-solid-svg-icons/faRightFromBracket';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

interface Transaction {
    cash_book_data: {
        transaction_type: string;
        transaction_amount: number;
        transaction_time: string;
    }[];
}

type RootStackParamList = {
    SignIn: undefined;
};
type SignInScreenProp = NativeStackNavigationProp<RootStackParamList, 'SignIn'>;

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
    const navigation = useNavigation<SignInScreenProp>();
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
        if (barChartPage > 0) {
            setBarChartPage(barChartPage - 1);
        }
    };

    const handleBarChartPreviousPage = () => {
        if (barChartPage < totalPages - 1) {
            setBarChartPage(barChartPage + 1);
        }
    };

    const handleLineChartNextPage = () => {
        if (lineChartPage > 0) {
            setLineChartPage(lineChartPage - 1);
        }
    };

    const handleLineChartPreviousPage = () => {
        if (lineChartPage < totalPages - 1) {
            setLineChartPage(lineChartPage + 1);
        }
    };

    const reversedIncome = dailyData.income.reverse();
    const reversedExpense = dailyData.expense.reverse();
    const reversedProfit = dailyData.profit.reverse();

    const slicedBarChartLabels = dateRange.slice(barChartPage * pageSize, (barChartPage + 1) * pageSize).reverse();
    const slicedBarChartProfit = reversedProfit.slice(barChartPage * pageSize, (barChartPage + 1) * pageSize).reverse();

    const slicedLineChartLabels = dateRange.slice(lineChartPage * pageSize, (lineChartPage + 1) * pageSize).reverse();
    const slicedLineChartIncome = reversedIncome.slice(lineChartPage * pageSize, (lineChartPage + 1) * pageSize).reverse();
    const slicedLineChartExpense = reversedExpense.slice(lineChartPage * pageSize, (lineChartPage + 1) * pageSize).reverse();
    const slicedLineChartProfit = reversedProfit.slice(lineChartPage * pageSize, (lineChartPage + 1) * pageSize).reverse();

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('refresh_token');
            navigation.navigate("SignIn");
            console.log("Successfully logged out");
        } catch (error) {
            console.error("Failed to logout:", error);
        }
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.topText}>Home</Text>
                <View style={styles.logoutContainer}>
                    <TouchableOpacity onPress={handleLogout}>
                        <FontAwesomeIcon icon={faRightFromBracket} size={24}/>
                    </TouchableOpacity>
                </View>
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
            <Text style={styles.chartTitle}>Daily Profit</Text>
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
                <Button title="Previous" onPress={handleBarChartPreviousPage}
                        disabled={barChartPage === totalPages - 1}/>
                <Text>{`${barChartPage + 1} / ${totalPages}`}</Text>
                <Button title="Next" onPress={handleBarChartNextPage} disabled={barChartPage === 0}/>
            </View>

            <Text style={styles.chartTitle}>Financial Metrics</Text>
            {dailyData.income.length > 0 && <LineChart
                data={{
                    labels: slicedLineChartLabels,
                    datasets: [
                        {data: slicedLineChartIncome, color: () => 'blue'},
                        {data: slicedLineChartExpense, color: () => 'red'},
                        {data: slicedLineChartProfit, color: () => 'green'},
                    ],
                }}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
            />}
            <View style={styles.paginationButtons}>
                <Button title="Previous" onPress={handleLineChartPreviousPage}
                        disabled={lineChartPage === totalPages - 1}/>
                <Text>{`${lineChartPage + 1} / ${totalPages}`}</Text>
                <Button title="Next" onPress={handleLineChartNextPage} disabled={lineChartPage === 0}/>
            </View>
        </ScrollView>
    );
};

const chartConfig = {
    backgroundColor: '#f5f5f5',
    backgroundGradientFrom: '#f5f5f5',
    backgroundGradientTo: '#f5f5f5',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 139, ${opacity})`,
    style: {
        borderRadius: 16,
    },
    propsForDots: {
        r: '5',
    },
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#FFFFFF',
        padding: 20,
    },
    header: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative',
    },
    topText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    logoutContainer: {
        position: 'absolute',
        right: 10,
        top: 6,
    },
    logoutText: {
        fontSize: 18,
        color: '#333',
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