import React from 'react';
import {View, Text, StyleSheet, ScrollView, Dimensions} from 'react-native';
import {LineChart, BarChart} from 'react-native-chart-kit';

const OwnerDashboard = () => {
    const screenWidth = Dimensions.get('window').width;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.topText}>Home</Text>
            </View>
            <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Today Sales</Text>
                <Text style={styles.infoCardValue}>Rs. 12,000.00</Text>
            </View>
            <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Incomes</Text>
                <Text style={styles.infoCardValue}>Rs. 8,000.00</Text>
            </View>
            <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Expenses</Text>
                <Text style={styles.infoCardValue}>Rs. 3,000.00</Text>
            </View>
            <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Profit</Text>
                <Text style={styles.infoCardValue}>Rs. 4,000.00</Text>
            </View>
            <Text style={styles.chartTitle}>Daily Sales</Text>
            <BarChart
                data={{
                    labels: ['28', '29', '30', '31', '1', '2', '3', '4', '5', '6'],
                    datasets: [{data: [30, 40, 50, 60, 50, 40, 45, 55, 60, 65]}],
                }}
                width={screenWidth - 40}
                height={220}
                yAxisLabel=""
                chartConfig={chartConfig}
                style={styles.chart}
                yAxisSuffix=""
            />
            <Text style={styles.chartTitle}>Financial Metrics</Text>
            <LineChart
                data={{
                    labels: ['28', '29', '30', '31', '1', '2', '3', '4', '5', '6'],
                    datasets: [
                        {data: [50, 60, 70, 80, 100, 120, 110, 130, 120, 140], color: () => 'blue', strokeWidth: 2},
                        {data: [20, 25, 30, 35, 40, 45, 50, 55, 60, 65], color: () => 'green', strokeWidth: 2},
                        {data: [10, 20, 30, 25, 30, 35, 40, 45, 50, 55], color: () => 'orange', strokeWidth: 2},
                    ],
                }}
                width={screenWidth - 40}
                height={220}
                yAxisLabel=""
                chartConfig={chartConfig}
                style={styles.chart}
            />
        </ScrollView>
    );
};

const chartConfig = {
    backgroundColor: '#e8f2f4',
    backgroundGradientFrom: '#e8f2f4',
    backgroundGradientTo: '#e8f2f4',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
    style: {
        borderRadius: 16,
    },
    propsForDots: {
        r: '6',
        strokeWidth: '2',
        stroke: '#ffa726',
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
    menuButton: {
        padding: 10,
        backgroundColor: '#ccc',
        borderRadius: 8,
    },
    menuText: {
        fontSize: 20,
        fontWeight: 'bold',
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
});

export default OwnerDashboard;
