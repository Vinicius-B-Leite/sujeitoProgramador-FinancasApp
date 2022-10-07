import React, { createContext, useEffect, useState } from "react";
import firebase from '../service/firebaseConnection'
import AsyncStorage from "@react-native-async-storage/async-storage";



export const AuthContext = createContext({})

export default function AuthProvider({children}) {

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)


    useEffect(()=>{
        async function loadingStorage(){
            const storage = await AsyncStorage.getItem('_authUser')
            
            if (storage){
                setUser(JSON.parse(storage))
                setLoading(false)
            }
            setLoading(false)
        }

        loadingStorage()
    }, [])

    async function singUp(email, password, nome){
        await firebase.auth().createUserWithEmailAndPassword(email, password).then( async (value) => {
            let uid = value.user.uid
            await firebase.database().ref('users').child(uid).set({
                nome: nome,
                saldo: 0,
            }).then(()=>{
                let data = {
                    uid: uid,
                    nome: nome,
                    email: value.user.email
                }
                setUser(data)
                storageUser(data)
            })

        })
    }

    async function singIn(email, password){
        await firebase.auth().signInWithEmailAndPassword(email, password).then(async (value) => {
            let uid = value.user.uid
            await firebase.database().ref('users').child(uid).once('value').then((snapshot) => {
                let data = {
                    uid,
                    nome: snapshot.val().nome,
                    email: value.user.email
                }
                setUser(data)
                storageUser(data)
            })
        }).catch((error)=>{
            alert(error.code)
        })
    }

    async function singout(){
        await firebase.auth().signOut()
        await AsyncStorage.clear()
        .then(()=>{
            setUser(null)
        })
    }

    async function storageUser(data){
        await AsyncStorage.setItem('_authUser', JSON.stringify(data))
    }

    return (
        <AuthContext.Provider value={{
            user,
            singUp,
            singIn,
            singout,
            loading,
            singned: !!user //se null ele fica false se tem coisa dentro ele fica true
        }}>
            {children}
        </AuthContext.Provider>
    );
}