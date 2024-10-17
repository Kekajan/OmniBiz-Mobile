import React, {useState} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Image,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import logo from "../../assets/images/logo-no-background.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from "../../../App.tsx";
import {env} from "../../../env";

type SignInScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignIn'>;

const SignIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('')
    const navigation = useNavigation<SignInScreenNavigationProp>();

    const handleSignIn = async () => {
        if (!email || !password) {
            setErrorMessage("Please fill in all fields")
            return;
        }
        setLoading(true);
        try {
            const access_token = await AsyncStorage.getItem('access_token');
            const refresh_token = await AsyncStorage.getItem('refresh_token');
            if (access_token || refresh_token) {
                await AsyncStorage.removeItem('access_token');
                await AsyncStorage.removeItem('refresh_token');
            }
            const response = await axios.post(`${env}auth/login`, {
                email: email,
                password: password,
            });
            if (response.status === 200) {
                const {access, refresh, user_role} = response.data;
                if (user_role === 'owner') {
                    await AsyncStorage.setItem('access_token', access);
                    await AsyncStorage.setItem('refresh_token', refresh);
                    console.log("Login successfully")
                    navigation.navigate("Home");
                    setEmail('');
                    setPassword('');
                } else {
                    setErrorMessage("Wrong email or password")
                }
            }
        } catch (error: any) {
            setLoading(false);
            if (
                error.response &&
                error.response.data &&
                error.response.data.message
            ) {
                setErrorMessage("Wrong email or password");
            } else {
                setErrorMessage("Oops! Something went wrong, try again later.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollViewContainer}>
                <View style={styles.topContainer}>
                    <View style={styles.logoContainer}>
                        <Image source={logo} style={styles.logo}/>
                    </View>
                </View>
                <View style={styles.formContainer}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Sign in</Text>
                        <Text style={styles.subtitle}>
                            Owner can login to track business performance
                        </Text>
                    </View>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor="#666"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            inputMode={"email"}
                            // autoCapitalize="none"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your password"
                            placeholderTextColor='#666'
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                        <TouchableOpacity>
                            <Text style={styles.forgotPassword}>Forgot Password?</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={[styles.signInButton, loading && styles.disabledButton]}
                        onPress={handleSignIn}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff"/>
                        ) : (
                            <Text style={styles.signInButtonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>
                    {errorMessage && <Text style={styles.errorMsg}>{errorMessage}</Text>}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        backgroundColor: '#ffffff',
    },
    scrollViewContainer: {
        flexGrow: 1,
    },
    topContainer: {
        marginTop: 90,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    appNameText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'center',
    },
    logo: {
        width: 180,
        height: 80,
        resizeMode: 'contain',
    },
    appName: {
        color: '#000000',
    },
    formContainer: {
        // backgroundColor: '#42c9e1',
        marginTop: 40,
    },
    titleContainer: {
        // backgroundColor: '#e85d5d',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    link: {
        // color: '#3498db',
    },
    inputContainer: {
        marginBottom: 30,
    },
    input: {
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 15,
        backgroundColor: '#fff',
        fontSize: 16,
        color: '#000000'
    },
    forgotPassword: {
        color: '#1053d1',
        textAlign: 'right',
        fontSize: 14,
        fontWeight: 'bold',
    },
    signInButton: {
        backgroundColor: '#333',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#aaa',
    },
    signInButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorMsg: {
        color: '#FF0000',
        fontWeight: 'bold'
    }
});

export default SignIn;
